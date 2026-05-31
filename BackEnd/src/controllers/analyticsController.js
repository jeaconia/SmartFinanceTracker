const supabase = require('../config/supabase');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validate YYYY-MM format */
function isValidMonth(m) {
  return typeof m === 'string' && /^\d{4}-\d{2}$/.test(m);
}

/** Validate YYYY format */
function isValidYear(y) {
  return typeof y === 'string' && /^\d{4}$/.test(y);
}

/** 'YYYY-MM' → N months before as 'YYYY-MM' */
function getNMonthsBefore(month, n) {
  const [year, mo] = month.split('-').map(Number);
  const d = new Date(year, mo - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Current month as 'YYYY-MM' */
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── GET /api/analytics/summary?month=YYYY-MM ────────────────────────────────
async function getSummary(req, res) {
  const userId = req.user.id;
  const month = req.query.month || currentMonth();

  if (!isValidMonth(month)) {
    return res.status(400).json({ success: false, error: 'month must be in YYYY-MM format' });
  }

  const { data, error } = await supabase
    .from('monthly_analytics')
    .select(
      'monthly_income, total_expense, transaction_count, avg_transaction_value, ' +
      'spending_growth_rate, category_ratio, last_month_expense, avg_3month_expense'
    )
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();

  if (error) {
    console.error('[getSummary]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // Return zeroed-out shape even when no analytics row exists yet for the month
  const row = data ?? {
    monthly_income: 0,
    total_expense: 0,
    transaction_count: 0,
    avg_transaction_value: 0,
    spending_growth_rate: null,
    category_ratio: null,
    last_month_expense: null,
    avg_3month_expense: null,
  };

  return res.json({
    success: true,
    data: {
      ...row,
      month,
      net: (row.monthly_income ?? 0) - (row.total_expense ?? 0),
    },
  });
}

// ─── GET /api/analytics/chart/monthly?year=YYYY ──────────────────────────────
async function getMonthlyChart(req, res) {
  const userId = req.user.id;
  const year = req.query.year || String(new Date().getFullYear());

  if (!isValidYear(year)) {
    return res.status(400).json({ success: false, error: 'year must be in YYYY format' });
  }

  // Use LIKE to filter by year prefix in the month column ('YYYY-MM')
  const { data, error } = await supabase
    .from('monthly_analytics')
    .select('month, total_expense, monthly_income')
    .eq('user_id', userId)
    .like('month', `${year}-%`)

  if (error) {
    console.error('[getMonthlyChart]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // Build a full 12-month array; pad missing months with zeros
  const rowMap = new Map((data ?? []).map((r) => [r.month, r]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const mo = String(i + 1).padStart(2, '0');
    const key = `${year}-${mo}`;
    const row = rowMap.get(key);
    const income = row?.monthly_income ?? 0;
    const expense = row?.total_expense ?? 0;
    return {
      month: key,
      total_expense: expense,
      monthly_income: income,
      net: income - expense,
    };
  });

  return res.json({ success: true, data: months });
}

// ─── GET /api/analytics/chart/category?month=YYYY-MM ─────────────────────────
async function getCategoryChart(req, res) {
  const userId = req.user.id;
  const month = req.query.month || currentMonth();

  if (!isValidMonth(month)) {
    return res.status(400).json({ success: false, error: 'month must be in YYYY-MM format' });
  }

  // Pull all expense transactions for the month and aggregate in JS
  // (Supabase PostgREST doesn't support GROUP BY natively)
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`);

  if (error) {
    console.error('[getCategoryChart]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // Aggregate by category
  const totals = {};
  let grandTotal = 0;
  for (const row of data ?? []) {
    totals[row.category] = (totals[row.category] ?? 0) + row.amount;
    grandTotal += row.amount;
  }

  const categories = Object.entries(totals).map(([category, total]) => ({
    category,
    total,
    percentage: grandTotal > 0 ? parseFloat(((total / grandTotal) * 100).toFixed(2)) : 0,
  }));

  // Sort descending by total for a sensible default chart order
  categories.sort((a, b) => b.total - a.total);

  return res.json({ success: true, data: categories });
}

// ─── GET /api/analytics/chart/trend?months=6 ─────────────────────────────────
async function getTrendChart(req, res) {
  const userId = req.user.id;
  const nMonths = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 24); // clamp 1-24

  const now = currentMonth();
  // Build list of last N months in ascending order
  const monthList = Array.from({ length: nMonths }, (_, i) =>
    getNMonthsBefore(now, nMonths - 1 - i)
  );

  const { data, error } = await supabase
    .from('monthly_analytics')
    .select('month, total_expense, monthly_income')
    .eq('user_id', userId)
    .in('month', monthList)
    .order('month', { ascending: true });

  if (error) {
    console.error('[getTrendChart]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // Pad missing months with zeros so the chart always has N data points
  const rowMap = new Map((data ?? []).map((r) => [r.month, r]));
  const trend = monthList.map((m) => {
    const row = rowMap.get(m);
    return {
      month: m,
      total_expense: row?.total_expense ?? 0,
      monthly_income: row?.monthly_income ?? 0,
    };
  });

  return res.json({ success: true, data: trend });
}

module.exports = {
  getSummary,
  getMonthlyChart,
  getCategoryChart,
  getTrendChart,
};