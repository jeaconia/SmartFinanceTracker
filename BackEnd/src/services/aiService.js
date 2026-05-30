const supabase = require('../config/supabase');

// ─── Constants ────────────────────────────────────────────────────────────────

// Fixed budget allocation ratios per category.
// The remaining 0.20 is a savings buffer and is intentionally NOT returned.
const BUDGET_RATIOS = {
  Belanja:          0.40,
  Kesehatan:        0.10,
  Hiburan:          0.15,
  Sosial:           0.10,
  'Hewan Peliharaan': 0.05,
};

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// ─── getBudgetRecommendation ──────────────────────────────────────────────────
/**
 * Pure rule-based budget recommendation — no external API call.
 *
 * Logic:
 *  1. Fetch user's city + umr_value from users table.
 *  2. Fetch avg_3month_expense from the most recent monthly_analytics row.
 *  3. base = (umr_value <= 0 || null) ? avg_3month_expense : MAX(umr_value, avg_3month_expense)
 *  4. Multiply base by each category's fixed ratio.
 *
 * @param {string} userId
 * @returns {{ recommendations, based_on_city, based_on_umr, base_amount }}
 */
async function getBudgetRecommendation(userId) {
  // ── 1. User profile ─────────────────────────────────────────────────────────
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('city, umr_value')
    .eq('id', userId)
    .maybeSingle();

  if (userError) throw new Error(`Failed to fetch user profile: ${userError.message}`);

  const city      = userRow?.city      ?? null;
  const umrValue  = userRow?.umr_value ?? 0;

  // ── 2. Avg 3-month expense ───────────────────────────────────────────────────
  const { data: analyticsRow, error: analyticsError } = await supabase
    .from('monthly_analytics')
    .select('avg_3month_expense')
    .eq('user_id', userId)
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analyticsError) throw new Error(`Failed to fetch analytics: ${analyticsError.message}`);

  const avg3Month = analyticsRow?.avg_3month_expense ?? 0;

  // ── 3. Determine base amount ─────────────────────────────────────────────────
  // If UMR is absent or zero, fall back entirely to spending history.
  // Otherwise take the higher of the two so recommendations are never below UMR.
  const validUmr = umrValue && umrValue > 0;
  const baseAmount = validUmr
    ? Math.max(umrValue, avg3Month)
    : avg3Month;

  // ── 4. Apply ratios ──────────────────────────────────────────────────────────
  const recommendations = {};
  for (const [category, ratio] of Object.entries(BUDGET_RATIOS)) {
    recommendations[category] = Math.round(baseAmount * ratio);
  }

  return {
    recommendations,
    based_on_city: city,
    based_on_umr: validUmr ? umrValue : null,
    base_amount: Math.round(baseAmount),
  };
}

// ─── getSpendingLabel ─────────────────────────────────────────────────────────
/**
 * Delegates to external FastAPI service.
 * POST {AI_SERVICE_URL}/classify  →  { spending_label, label_confidence, label_traits, ... }
 *
 * @param {string} userId
 * @param {string} month  'YYYY-MM'
 * @returns {object} Raw response from the AI service
 */
async function getSpendingLabel(userId, month) {
  if (!AI_SERVICE_URL) {
    throw new Error('AI_SERVICE_URL is not configured in environment variables');
  }

  let response;
  try {
    response = await fetch(`${AI_SERVICE_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, month }),
    });
  } catch (networkErr) {
    throw new Error(`AI service unreachable: ${networkErr.message}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI service returned ${response.status}: ${errText}`);
  }

  return response.json();
}

// ─── predictNextMonthExpense ──────────────────────────────────────────────────
/**
 * Delegates to external FastAPI service.
 * POST {AI_SERVICE_URL}/predict  →  { predicted_total_expense, ... }
 *
 * @param {string} userId
 * @returns {object} Raw response from the AI service
 */
async function predictNextMonthExpense(userId) {
  if (!AI_SERVICE_URL) {
    throw new Error('AI_SERVICE_URL is not configured in environment variables');
  }

  let response;
  try {
    response = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
  } catch (networkErr) {
    throw new Error(`AI service unreachable: ${networkErr.message}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI service returned ${response.status}: ${errText}`);
  }

  return response.json();
}

module.exports = {
  getBudgetRecommendation,
  getSpendingLabel,
  predictNextMonthExpense,
};