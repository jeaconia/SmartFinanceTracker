const supabase = require('../config/supabase');

/**
 * Calculate and upsert monthly_analytics for a given user + month.
 * Called fire-and-forget after any transaction mutation.
 *
 * @param {string} userId - UUID of the user
 * @param {string} month  - 'YYYY-MM' format
 */
async function upsertMonthlyAnalytics(userId, month) {
  try {
    // ── 1. Aggregate current month's transactions ──────────────────────────
    const { data: txRows, error: txError } = await supabase
      .from('transactions')
      .select('type, amount, category')
      .eq('user_id', userId)
      .like('date', `${month}-%`);

    if (txError) throw txError;

    const expenseRows = txRows.filter((r) => r.type === 'expense');
    const incomeRows  = txRows.filter((r) => r.type === 'income');

    const total_expense         = expenseRows.reduce((s, r) => s + r.amount, 0);
    const monthly_income        = incomeRows.reduce((s, r) => s + r.amount, 0);
    const transaction_count     = expenseRows.length;
    const avg_transaction_value = transaction_count > 0
      ? Math.round(total_expense / transaction_count)
      : 0;

    // ── 2. Category ratio ────────────────────────────────────────────────────
    let category_ratio = null;
    if (total_expense > 0) {
      const totals = {};
      for (const row of expenseRows) {
        totals[row.category] = (totals[row.category] || 0) + row.amount;
      }
      category_ratio = {};
      for (const [cat, total] of Object.entries(totals)) {
        category_ratio[cat] = parseFloat((total / total_expense).toFixed(4));
      }
    }

    // ── 3. Last month's total_expense (t-1) ──────────────────────────────────
    const lastMonth = getNMonthsBefore(month, 1);
    const { data: lastMonthRow, error: lastMonthError } = await supabase
      .from('monthly_analytics')
      .select('total_expense')
      .eq('user_id', userId)
      .eq('month', lastMonth)
      .maybeSingle();

    if (lastMonthError) throw lastMonthError;
    const last_month_expense = lastMonthRow?.total_expense ?? null;

    // ── 4. Avg of last 3 months ──────────────────────────────────────────────
    const last3Months = [1, 2, 3].map((n) => getNMonthsBefore(month, n));
    const { data: last3Rows, error: last3Error } = await supabase
      .from('monthly_analytics')
      .select('total_expense')
      .eq('user_id', userId)
      .in('month', last3Months);

    if (last3Error) throw last3Error;

    let avg_3month_expense = null;
    if (last3Rows && last3Rows.length > 0) {
      const sum = last3Rows.reduce((s, r) => s + (r.total_expense || 0), 0);
      avg_3month_expense = Math.round(sum / last3Rows.length);
    }

    // ── 5. Spending growth rate ───────────────────────────────────────────────
    let spending_growth_rate = null;
    if (last_month_expense !== null && last_month_expense > 0) {
      spending_growth_rate = parseFloat(
        (((total_expense - last_month_expense) / last_month_expense) * 100).toFixed(2)
      );
    }

    // ── 6. Upsert ────────────────────────────────────────────────────────────
    const { error: upsertError } = await supabase
      .from('monthly_analytics')
      .upsert(
        {
          user_id: userId,
          month,
          monthly_income,
          total_expense,
          transaction_count,
          avg_transaction_value,
          last_month_expense,
          avg_3month_expense,
          spending_growth_rate,
          category_ratio,
          calculated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' }
      );

    if (upsertError) throw upsertError;

  } catch (err) {
    console.error(
      `[analyticsService] upsertMonthlyAnalytics failed (user=${userId}, month=${month}):`,
      err.message
    );
  }
}

/** 'YYYY-MM' → N months before as 'YYYY-MM' */
function getNMonthsBefore(month, n) {
  const [year, mo] = month.split('-').map(Number);
  const date = new Date(year, mo - 1 - n, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

module.exports = { upsertMonthlyAnalytics };
