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

/** Last day of month as YYYY-MM-DD */
function monthEndDate(month) {
  const [year, mo] = month.split('-').map(Number);
  const lastDay = new Date(year, mo, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

// ─── GET /api/analytics/summary?month=YYYY-MM ────────────────────────────────
async function getSummary(req, res) {
  const userId = req.user.id;
  const month = req.query.month || currentMonth();

  if (!isValidMonth(month)) {
    return res.status(400).json({ success: false, error: 'month must be in YYYY-MM format' });
  }

  // Hitung langsung dari transactions agar selalu real-time
  const { data: txRows, error: txError } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', `${month}-01`)
    .lte('date', monthEndDate(month));

  if (txError) {
    console.error('[getSummary]', txError);
    return res.status(500).json({ success: false, error: txError.message });
  }

  const monthly_income = (txRows ?? [])
    .filter(r => r.type === 'income')
    .reduce((s, r) => s + r.amount, 0);
  const total_expense = (txRows ?? [])
    .filter(r => r.type === 'expense')
    .reduce((s, r) => s + r.amount, 0);

  // Ambil growth rate dari monthly_analytics jika ada (opsional)
  const { data: analyticsRow } = await supabase
    .from('monthly_analytics')
    .select('spending_growth_rate')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();

  return res.json({
    success: true,
    data: {
      month,
      monthly_income,
      total_expense,
      net: monthly_income - total_expense,
      spending_growth_rate: analyticsRow?.spending_growth_rate ?? null,
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
  const monthKeys = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

  let transactionSummary;
  try {
    transactionSummary = await getTransactionMonthSummary(userId, monthKeys);
  } catch (txError) {
    console.error('[getMonthlyChart] transaction fallback failed', txError);
    transactionSummary = new Map();
  }

  const months = monthKeys.map((key) => {
    const row = rowMap.get(key) ?? transactionSummary.get(key);
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
  const type = (req.query.type || 'expense').toLowerCase();

  if (!isValidMonth(month)) {
    return res.status(400).json({ success: false, error: 'month must be in YYYY-MM format' });
  }

  if (!['expense', 'income'].includes(type)) {
    return res.status(400).json({ success: false, error: 'type must be either expense or income' });
  }

  // Pull all matching transactions for the month and aggregate in JS
  // (Supabase PostgREST doesn't support GROUP BY natively)
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('date', `${month}-01`)
    .lte('date', monthEndDate(month));

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

async function getTransactionMonthSummary(userId, monthList) {
  // Query all transactions between the first and last requested month.
  const from = `${monthList[0]}-01`;
  const to = monthEndDate(monthList[monthList.length - 1]);

  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, type')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to);

  if (error) {
    throw error;
  }

  const summary = new Map();
  for (const month of monthList) {
    summary.set(month, { monthly_income: 0, total_expense: 0 });
  }

  for (const tx of data ?? []) {
    const txMonth = tx.date?.substring(0, 7);
    if (!summary.has(txMonth)) continue;

    const row = summary.get(txMonth);
    if (tx.type === 'income') row.monthly_income += tx.amount;
    if (tx.type === 'expense') row.total_expense += tx.amount;
  }

  return summary;
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

  const analyticsMap = new Map((data ?? []).map((r) => [r.month, r]));
  let transactionSummary;

  try {
    transactionSummary = await getTransactionMonthSummary(userId, monthList);
  } catch (txError) {
    console.error('[getTrendChart] transaction fallback failed', txError);
    transactionSummary = new Map();
  }

  const trend = monthList.map((m) => {
    const row = analyticsMap.get(m);
    const fallback = transactionSummary.get(m);
    return {
      month: m,
      total_expense: row?.total_expense ?? fallback?.total_expense ?? 0,
      monthly_income: row?.monthly_income ?? fallback?.monthly_income ?? 0,
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