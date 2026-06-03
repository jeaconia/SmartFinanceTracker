const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidMonth(m) {
  return typeof m === 'string' && /^\d{4}-\d{2}$/.test(m);
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Return the next calendar month as 'YYYY-MM' */
function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Upsert a partial set of columns into ai_results for (user_id, month).
 * We always upsert so repeated calls refresh stale predictions without
 * creating duplicate rows.
 *
 * @param {string}  userId
 * @param {string}  month   'YYYY-MM'
 * @param {object}  fields  Columns to set (merged with existing row on conflict)
 */
async function upsertAiResult(userId, month, fields) {
  const { error } = await supabase
    .from('ai_results')
    .upsert(
      { user_id: userId, month, ...fields },
      { onConflict: 'user_id,month' }
    );

  if (error) {
    // Non-fatal: log and continue — the API response is still returned to the client
    console.error(`[aiController] upsertAiResult(${userId}, ${month}):`, error.message);
  }
}

// ─── GET /api/ai/budget-recommendation ────────────────────────────────────────
async function getBudgetRecommendation(req, res) {
  const userId = req.user.id;

  let result;
  try {
    result = await aiService.getBudgetRecommendation(userId);
  } catch (err) {
    console.error('[getBudgetRecommendation]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }

  // Persist to ai_results for the current month (fire-and-forget, non-blocking)
  upsertAiResult(userId, currentMonth(), {
    budget_recommendation:        result.recommendations,
    recommendation_based_on_city: result.based_on_city,
    recommendation_based_on_umr:  result.based_on_umr,
  });

  return res.json({ success: true, data: result });
}

// ─── GET /api/ai/spending-label?month=YYYY-MM ─────────────────────────────────
async function getSpendingLabel(req, res) {
  const userId = req.user.id;
  const month  = req.query.month || currentMonth();

  if (!isValidMonth(month)) {
    return res.status(400).json({ success: false, error: 'month must be in YYYY-MM format' });
  }

  let result;
  try {
    result = await aiService.getSpendingLabel(userId, month);
  } catch (err) {
    console.error('[getSpendingLabel]', err.message);
    return res.status(502).json({ success: false, error: err.message });
  }

  // Persist label fields — save whatever the AI service returned that maps to our columns
  upsertAiResult(userId, month, {
    spending_label:     result.spending_label     ?? result.label     ?? null,
    label_confidence:   result.label_confidence   ?? result.confidence ?? null,
    label_traits:       result.label_traits       ?? result.traits     ?? null,
  });

  return res.json({ success: true, data: result });
}

// ─── GET /api/ai/predict ──────────────────────────────────────────────────────
async function predictNextMonthExpense(req, res) {
  const userId = req.user.id;

  let result;
  try {
    result = await aiService.predictNextMonthExpense(userId);
  } catch (err) {
    console.error('[predictNextMonthExpense]', err.message);
    return res.status(502).json({ success: false, error: err.message });
  }

  // ── Extract bulan_ke:1 as predicted_total_expense ─────────────────────────
  // proporsi_terhadap_pendapatan adalah rasio terhadap pendapatan (misal 0.85 = 85%)
  // perlu dikalikan pendapatan bulanan untuk dapat nilai Rupiah
  const predictions = result?.predictions ?? [];
  const bulan1      = predictions.find((p) => p.bulan_ke === 1);

  // Ambil pendapatan bulan ini dari monthly_analytics
  const currentMonthVal = currentMonth();
  const { data: analyticsRow } = await supabase
    .from('monthly_analytics')
    .select('monthly_income')
    .eq('user_id', userId)
    .eq('month', currentMonthVal)
    .maybeSingle();

  const income = analyticsRow?.monthly_income ?? 0;
  const predicted_total_expense = (bulan1 && income > 0)
    ? Math.round(bulan1.proporsi_terhadap_pendapatan * income)
    : null;

  // ── Persist to ai_results (fire-and-forget) ───────────────────────────────
  upsertAiResult(userId, nextMonth(), {
    predicted_total_expense,
  });

  return res.json({ success: true, data: { ...result, predicted_total_expense } });
}

// ─── GET /api/ai/results?month=YYYY-MM ───────────────────────────────────────
async function getAiResults(req, res) {
  const userId = req.user.id;
  const month  = req.query.month || currentMonth();

  if (!isValidMonth(month)) {
    return res.status(400).json({ success: false, error: 'month must be in YYYY-MM format' });
  }

  const { data, error } = await supabase
    .from('ai_results')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();

  if (error) {
    console.error('[getAiResults]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // Return null data (not 404) when no AI results have been generated yet
  return res.json({ success: true, data: data ?? null });
}

module.exports = {
  getBudgetRecommendation,
  getSpendingLabel,
  predictNextMonthExpense,
  getAiResults,
};