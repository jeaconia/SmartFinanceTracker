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
 * Fetches 3 months of historical data from monthly_analytics, assembles
 * a (3, 12) feature matrix, then calls APIFITUR2 FastAPI /predict.
 *
 * @param {string} userId
 * @returns {object} Raw response from the AI service
 */
async function predictNextMonthExpense(userId) {
  // ── GUARD 1: env var wajib ada ────────────────────────────────────────────
  if (!AI_SERVICE_URL) {
    throw new Error('AI_SERVICE_URL is not configured in environment variables');
  }

  // ── 1. Fetch 4 baris (3 untuk fitur + 1 ekstra untuk ratio_last baris pertama)
  const { data, error } = await supabase
    .from('monthly_analytics')
    .select('month, total_expense, transaction_count, avg_transaction_value, monthly_income, spending_growth_rate, last_month_expense, avg_3month_expense, expense_to_income_ratio')
    .eq('user_id', userId)
    .order('month', { ascending: false })
    .limit(4);

  if (error) throw new Error(`Failed to fetch monthly_analytics: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error('Tidak cukup data historis untuk prediksi (minimum 1 bulan)');
  }

  // ── 2. Urutkan dari lama ke baru (reverse dari DESC) ──────────────────────
  const rows       = [...data].reverse();
  const workingRows = rows.length === 4 ? rows.slice(1) : rows; // maks 3 baris kerja
  const extraRow    = rows.length === 4 ? rows[0] : null;       // untuk ratio_last baris pertama

  // ── 3. Helper: rakit satu baris fitur [12] ────────────────────────────────
  function buildRow(row, ratioLast) {
    const [yearStr, monthStr] = row.month.split('-');
    const isOverspending = (row.total_expense ?? 0) > (row.monthly_income ?? 0) ? 1 : 0;
    return [
      parseInt(monthStr, 10),                // 1  bulan
      parseInt(yearStr,  10),                // 2  tahun
      row.total_expense           ?? 0,      // 3  total_expense
      row.transaction_count       ?? 0,      // 4  transaction_count
      row.avg_transaction_value   ?? 0,      // 5  avg_transaction_value
      isOverspending,                        // 6  is_overspending
      row.monthly_income          ?? 0,      // 7  monthly_income
      row.spending_growth_rate    ?? 0,      // 8  spending_growth_rate
      row.last_month_expense      ?? 0,      // 9  last_month_expense
      row.avg_3month_expense      ?? 0,      // 10 avg_3month_expense
      row.expense_to_income_ratio ?? 0,      // 11 ratio_current
      ratioLast                   ?? 0,      // 12 ratio_last
    ];
  }

  // ── 4. Rakit features[3][12], padding baris kosong di depan jika < 3 bulan
  const EMPTY_ROW = Array(12).fill(0);
  const features  = [];

  for (let i = 0; i < workingRows.length; i++) {
    const prevRow   = i === 0 ? extraRow : workingRows[i - 1];
    const ratioLast = prevRow?.expense_to_income_ratio ?? 0;
    features.push(buildRow(workingRows[i], ratioLast));
  }

  while (features.length < 3) {
    features.unshift(EMPTY_ROW);
  }

  // ── GUARD 2: validasi shape (3, 12) dan tidak ada NaN ────────────────────
  if (
    features.length !== 3 ||
    features.some((row) => !Array.isArray(row) || row.length !== 12) ||
    features.some((row) => row.some((v) => typeof v !== 'number' || isNaN(v)))
  ) {
    throw new Error(
      `Invalid features shape: expected (3, 12) of numbers, ` +
      `got (${features.length}, ${features[0]?.length ?? '?'})`
    );
  }

  // ── GUARD 3: timeout 10 detik ─────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10_000);

  let response;
  try {
    response = await fetch(`${AI_SERVICE_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ user_id: userId, features }),
      signal:  controller.signal,
    });
  } catch (networkErr) {
    const msg = networkErr.name === 'AbortError'
      ? 'AI service timeout after 10s'
      : `AI service unreachable: ${networkErr.message}`;
    throw new Error(msg);
  } finally {
    clearTimeout(timeoutId);
  }

  // ── GUARD 4: HTTP status bukan 2xx ───────────────────────────────────────
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI service returned ${response.status}: ${errText}`);
  }

  // ── GUARD 5: validasi struktur JSON response ──────────────────────────────
  const result = await response.json();

  if (!result?.success || !Array.isArray(result?.predictions)) {
    throw new Error(
      `AI service response malformed: missing "success" or "predictions". ` +
      `Got: ${JSON.stringify(result).slice(0, 200)}`
    );
  }

  return result;
}

module.exports = {
  getBudgetRecommendation,
  getSpendingLabel,
  predictNextMonthExpense,
};