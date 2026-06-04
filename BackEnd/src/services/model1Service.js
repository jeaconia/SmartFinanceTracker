/**
 * model1Service.js
 * ─────────────────────────────────────────────────────────────
 * Integrasi dengan Model 1 v2: Spending Persona Classifier
 * (Wide & Deep model — FastAPI di MODEL1_SERVICE_URL)
 *
 * Endpoint yang dipakai: POST /analyze
 *   - use_llm: false  → template insight (cepat, tanpa biaya API)
 *   - previous_persona diambil dari ai_results bulan sebelumnya
 *
 * Output yang disimpan ke ai_results:
 *   spending_label, label_confidence, label_traits
 * ─────────────────────────────────────────────────────────────
 */

const supabase = require('../config/supabase');

const MODEL1_SERVICE_URL = process.env.MODEL1_SERVICE_URL;

// Kategori yang dikenali Model 1 (ALL_CATEGORIES di spending_persona_api_v2.py)
const VALID_CATEGORIES = new Set([
  'Anak-Anak', 'Belanja', 'Elektronik', 'Hewan Peliharaan', 'Hiburan',
  'Kesehatan', 'Makanan', 'Olahraga', 'Pakaian', 'Pendidikan',
  'Perumahan', 'Sosial', 'Tagihan', 'Transportasi', 'Traveling',
]);

// Mapping kategori Supabase → Model 1 (null = skip)
const CATEGORY_MAP = {
  'Makanan & Minuman' : 'Makanan',
  'Tagihan Tetap'     : 'Tagihan',
  'Kost'              : 'Perumahan',
  'Investasi'         : null,
  'Investasi/Tabungan': null,
  'Tabungan'          : null,
};

const VALID_PERSONAS = new Set(['saver', 'balanced', 'spender', 'overspending']);

// ── Helpers ──────────────────────────────────────────────────────

/** Hitung YYYY-MM bulan sebelumnya dari string 'YYYY-MM' */
function prevMonthStr(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // m-2 karena Date bulan 0-indexed
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Core ─────────────────────────────────────────────────────────

/**
 * Ambil & format transaksi expense user bulan tertentu
 * ke struktur yang dibutuhkan Model 1.
 */
async function buildTransactions(userId, month, city, income) {
  const [year, mon] = month.split('-').map(Number);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', mon)
    .eq('type', 'expense');

  if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(`Tidak ada data transaksi untuk bulan ${month}`);
  }

  const transactions = [];
  for (const tx of data) {
    let cat = tx.category;
    if (cat in CATEGORY_MAP) cat = CATEGORY_MAP[cat];
    if (!cat || !VALID_CATEGORIES.has(cat)) continue;
    transactions.push({
      bulan              : mon,
      tahun              : year,
      Kota               : city || 'Jakarta',
      Kategori           : cat,
      pendapatan_bulanan : income,
      jumlah_pengeluaran : tx.amount,
    });
  }

  if (transactions.length === 0) {
    throw new Error(`Tidak ada transaksi dengan kategori valid untuk bulan ${month}`);
  }
  return transactions;
}

/**
 * Panggil Model 1 v2 untuk mendapatkan spending persona + insight
 * user untuk bulan tertentu.
 *
 * @param {string} userId
 * @param {string} month  'YYYY-MM'
 * @returns {{ spending_label, label_confidence, label_traits, _meta }}
 */
async function getSpendingPersona(userId, month) {
  if (!MODEL1_SERVICE_URL) {
    throw new Error('MODEL1_SERVICE_URL is not configured in environment variables');
  }

  // 1. Ambil user city, income bulan ini, dan persona bulan lalu — paralel
  const prevMonth = prevMonthStr(month);

  const [userRes, analyticsRes, prevPersonaRes] = await Promise.all([
    supabase.from('users').select('city').eq('id', userId).single(),
    supabase
      .from('monthly_analytics')
      .select('monthly_income')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle(),
    supabase
      .from('ai_results')
      .select('spending_label')
      .eq('user_id', userId)
      .eq('month', prevMonth)
      .maybeSingle(),
  ]);

  if (userRes.error) throw new Error(`Failed to fetch user: ${userRes.error.message}`);

  const city   = userRes.data?.city || 'Jakarta';
  const income = analyticsRes.data?.monthly_income || 0;

  if (income === 0) {
    throw new Error(`Tidak ada data pendapatan untuk bulan ${month}`);
  }

  // previous_persona hanya dikirim kalau valid (ada & dikenali model)
  const prevLabel = prevPersonaRes.data?.spending_label ?? null;
  const previousPersona = (prevLabel && VALID_PERSONAS.has(prevLabel)) ? prevLabel : null;

  // 2. Build transactions
  const transactions = await buildTransactions(userId, month, city, income);

  // 3. Call Model 1 v2 /analyze (use_llm: false → template insight, hemat biaya)
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15_000);

  let response;
  try {
    response = await fetch(`${MODEL1_SERVICE_URL}/analyze`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        transactions,
        use_llm         : false,
        previous_persona: previousPersona,
      }),
      signal: controller.signal,
    });
  } catch (networkErr) {
    const msg = networkErr.name === 'AbortError'
      ? 'Model 1 service timeout after 15s'
      : `Model 1 service unreachable: ${networkErr.message}`;
    throw new Error(msg);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Model 1 returned ${response.status}: ${errText}`);
  }

  const result = await response.json();

  const pred   = result.prediction ?? {};
  const insight = result.insight   ?? {};

  // 4. Map ke kolom ai_results
  //    spending_label    → persona
  //    label_confidence  → confidence
  //    label_traits      → gabungan proba + insight keys yang tersedia
  const probaTraits = Object.entries(pred.proba || {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([label, score]) => `${label}:${(score * 100).toFixed(1)}%`);

  // Sertakan transition_note di traits kalau ada (informatif untuk frontend)
  const allTraits = [...probaTraits];
  if (insight.transition_note) {
    allTraits.push(`transition:${insight.transition_note}`);
  }

  return {
    spending_label  : pred.persona    ?? null,
    label_confidence: pred.confidence ?? null,
    label_traits    : allTraits.length > 0 ? allTraits : null,
    // _meta tidak disimpan ke DB, tapi diteruskan ke response API
    _meta: {
      method           : pred.method,
      avg_monthly_ratio: pred.avg_monthly_ratio,
      pct_kebutuhan    : pred.pct_kebutuhan,
      pct_gaya_hidup   : pred.pct_gaya_hidup,
      top_category     : pred.top_category,
      insight_mode     : result.insight_mode,
      persona_insight  : insight.persona_insight  ?? null,
      category_insight : insight.category_insight ?? null,
      trend_insight    : insight.trend_insight    ?? null,
      transition_note  : insight.transition_note  ?? null,
      budget           : result.budget            ?? null,
    },
  };
}

module.exports = { getSpendingPersona };