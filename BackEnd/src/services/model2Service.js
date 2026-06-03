/**
 * model2Service.js
 * ─────────────────────────────────────────────────────────────
 * Integrasi dengan AutoBudgeting Model (Model 2):
 *   Prediksi rasio pengeluaran bulan depan +
 *   rekomendasi alokasi budget 50/30/20 berbasis ML.
 *
 * Endpoint yang dipakai: POST /predict
 *   Input  : data bulanan user + historis lag/rolling (opsional)
 *   Output : prediksi rasio, status risiko, budget_recommendation
 *
 * Output yang disimpan ke ai_results:
 *   budget_recommendation, recommendation_based_on_city,
 *   recommendation_based_on_umr
 * ─────────────────────────────────────────────────────────────
 */

const supabase = require('../config/supabase');

const MODEL2_SERVICE_URL = process.env.MODEL2_SERVICE_URL;

// ── Helper: 'YYYY-MM' bulan sebelumnya ──────────────────────
function prevMonthStr(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getNMonthsBefore(month, n) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Core ─────────────────────────────────────────────────────

/**
 * Panggil AutoBudgeting Model untuk mendapatkan prediksi budget
 * rekomendasi bulan depan berdasarkan data historis user.
 *
 * @param {string} userId
 * @param {string} month  'YYYY-MM' — bulan referensi (biasanya bulan ini)
 * @returns {object} Hasil prediksi dari model (prediction + budget_recommendation)
 */
async function getAutoBudgetRecommendation(userId, month) {
  if (!MODEL2_SERVICE_URL) {
    throw new Error('MODEL2_SERVICE_URL is not configured in environment variables');
  }

  // ── 1. Ambil user profile + analytics bulan ini + 3 bulan lalu — paralel ──
  const prev1 = prevMonthStr(month);
  const prev2 = getNMonthsBefore(month, 2);
  const prev3 = getNMonthsBefore(month, 3);

  const [userRes, analyticsRes, historisRes] = await Promise.all([
    supabase
      .from('users')
      .select('city, umr_value')
      .eq('id', userId)
      .single(),

    supabase
      .from('monthly_analytics')
      .select('monthly_income, total_expense, expense_to_income_ratio, month')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle(),

    // 3 bulan terakhir untuk fitur lag & rolling
    supabase
      .from('monthly_analytics')
      .select('month, total_expense, monthly_income, expense_to_income_ratio')
      .eq('user_id', userId)
      .in('month', [prev1, prev2, prev3])
      .order('month', { ascending: false }),
  ]);

  if (userRes.error) throw new Error(`Failed to fetch user: ${userRes.error.message}`);

  const city       = userRes.data?.city    ?? null;
  const umrValue   = userRes.data?.umr_value ?? null;
  const analytics  = analyticsRes.data;

  if (!analytics) {
    throw new Error(`Tidak ada data monthly_analytics untuk bulan ${month}`);
  }

  const pendapatan        = analytics.monthly_income ?? 0;
  const total_pengeluaran = analytics.total_expense  ?? 0;

  if (pendapatan <= 0) {
    throw new Error(`Pendapatan bulan ${month} tidak valid (${pendapatan})`);
  }

  // ── 2. Hitung lag & rolling dari histori ─────────────────────────────────
  const histRows = historisRes.data ?? [];

  // Fungsi bantu: ambil expense_to_income_ratio per bulan
  function getRatioForMonth(m) {
    const row = histRows.find((r) => r.month === m);
    if (!row || !row.monthly_income || row.monthly_income <= 0) return null;
    return row.expense_to_income_ratio
      ?? (row.total_expense / row.monthly_income);
  }

  const lag1 = getRatioForMonth(prev1);
  const lag2 = getRatioForMonth(prev2);
  const lag3 = getRatioForMonth(prev3);

  const validLags = [lag1, lag2, lag3].filter((v) => v !== null);
  const rolling_mean_2 = validLags.length >= 2
    ? (validLags[0] + validLags[1]) / 2
    : validLags[0] ?? null;

  const rolling_mean_3 = validLags.length >= 3
    ? (validLags[0] + validLags[1] + validLags[2]) / 3
    : rolling_mean_2;

  const rolling_mean_6 = rolling_mean_3; // hanya 3 bulan tersedia

  const rolling_std_3 = validLags.length >= 2
    ? (() => {
        const mean = rolling_mean_3 ?? validLags.reduce((s, v) => s + v, 0) / validLags.length;
        const variance = validLags.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / validLags.length;
        return Math.sqrt(variance);
      })()
    : null;

  // ── 3. Build payload ke AutoBudgeting API ────────────────────────────────
  const [yearStr, monthStr] = month.split('-');

  const payload = {
    user_id: userId,
    kota:    city ?? 'Jakarta',
    bulan:   parseInt(monthStr, 10),
    tahun:   parseInt(yearStr,  10),
    pendapatan_bulanan: pendapatan,
    total_pengeluaran,

    // Opsional — dikirim null jika tidak tersedia (API akan fallback otomatis)
    rasio_lag_1:    lag1,
    rasio_lag_2:    lag2,
    rasio_lag_3:    lag3,
    rolling_mean_2: rolling_mean_2,
    rolling_mean_3: rolling_mean_3,
    rolling_mean_6: rolling_mean_6,
    rolling_std_3:  rolling_std_3,
  };

  // ── 4. Call AutoBudgeting API ─────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15_000);

  let response;
  try {
    response = await fetch(`${MODEL2_SERVICE_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
  } catch (networkErr) {
    const msg = networkErr.name === 'AbortError'
      ? 'AutoBudgeting service timeout after 15s'
      : `AutoBudgeting service unreachable: ${networkErr.message}`;
    throw new Error(msg);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AutoBudgeting service returned ${response.status}: ${errText}`);
  }

  const result = await response.json();

  if (!result?.success || !result?.budget_recommendation) {
    throw new Error(`AutoBudgeting service response malformed: ${JSON.stringify(result).slice(0, 200)}`);
  }

  // ── 5. Reshape output sesuai format yang dipakai aiController ─────────────
  const rec   = result.budget_recommendation;
  const pred  = result.prediction;

  return {
    // Format rekomendasi sebagai array (kompatibel dengan format lama)
    recommendations: [
      {
        category:          'Kebutuhan',
        recommended_limit: rec.budget_kebutuhan,
        reason:            `${rec.kebutuhan_persen}% dari pendapatan`,
      },
      {
        category:          'Keinginan',
        recommended_limit: rec.budget_keinginan,
        reason:            `${rec.keinginan_persen}% dari pendapatan`,
      },
      {
        category:          'Tabungan',
        recommended_limit: rec.budget_tabungan,
        reason:            `${rec.tabungan_persen}% dari pendapatan`,
      },
    ],

    bucket_summary: {
      kebutuhan_pct: `${rec.kebutuhan_persen}%`,
      keinginan_pct: `${rec.keinginan_persen}%`,
      tabungan_pct:  `${rec.tabungan_persen}%`,
      disposable:    Math.round(pendapatan - (total_pengeluaran ?? 0)),
    },

    // Prediksi dari ML model
    prediction: {
      prediksi_rasio_pengeluaran:     pred.prediksi_rasio_pengeluaran,
      prediksi_pengeluaran_bulan_depan: pred.prediksi_pengeluaran_bulan_depan,
      prediksi_sisa_anggaran:         pred.prediksi_sisa_anggaran,
      status_risiko:                  pred.status_risiko,
    },

    persona:       pred.status_risiko,
    based_on_city: city,
    based_on_umr:  umrValue,
    base_amount:   Math.round(pendapatan),

    // Untuk disimpan ke ai_results.budget_recommendation (JSONB)
    _db_payload: {
      budget_recommendation:        result.budget_recommendation,
      recommendation_based_on_city: city,
      recommendation_based_on_umr:  umrValue ?? result.model_info?.umr ?? null,
    },
  };
}

module.exports = { getAutoBudgetRecommendation };