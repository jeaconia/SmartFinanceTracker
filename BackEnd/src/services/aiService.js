const supabase = require('../config/supabase');

// ─── CITY_KB (dari fitur3_autobudgeting_cityaware.py) ─────────────────────────
const CITY_KB = {
  Jakarta:          { umr: 5441000, avg_kos: 2500000, transport_factor: 1.30, makanan_factor: 1.20 },
  Surabaya:         { umr: 4525000, avg_kos: 1800000, transport_factor: 1.10, makanan_factor: 1.00 },
  Bandung:          { umr: 4209000, avg_kos: 1500000, transport_factor: 1.00, makanan_factor: 0.95 },
  Medan:            { umr: 3800000, avg_kos: 1200000, transport_factor: 1.00, makanan_factor: 0.95 },
  Semarang:         { umr: 3243000, avg_kos: 1200000, transport_factor: 0.90, makanan_factor: 0.85 },
  Makassar:         { umr: 3800000, avg_kos: 1300000, transport_factor: 1.00, makanan_factor: 0.90 },
  Palembang:        { umr: 3600000, avg_kos: 1100000, transport_factor: 0.90, makanan_factor: 0.88 },
  Tangerang:        { umr: 4700000, avg_kos: 2000000, transport_factor: 1.20, makanan_factor: 1.10 },
  Depok:            { umr: 4700000, avg_kos: 1900000, transport_factor: 1.20, makanan_factor: 1.05 },
  Bekasi:           { umr: 5500000, avg_kos: 2000000, transport_factor: 1.25, makanan_factor: 1.10 },
  Bogor:            { umr: 4639000, avg_kos: 1500000, transport_factor: 1.00, makanan_factor: 0.95 },
  Yogyakarta:       { umr: 2300000, avg_kos:  900000, transport_factor: 0.85, makanan_factor: 0.80 },
  Solo:             { umr: 2300000, avg_kos:  900000, transport_factor: 0.85, makanan_factor: 0.80 },
  Malang:           { umr: 3294000, avg_kos: 1100000, transport_factor: 0.90, makanan_factor: 0.85 },
  Denpasar:         { umr: 3000000, avg_kos: 1600000, transport_factor: 1.00, makanan_factor: 1.00 },
  Balikpapan:       { umr: 3300000, avg_kos: 1400000, transport_factor: 1.10, makanan_factor: 1.10 },
  Samarinda:        { umr: 3200000, avg_kos: 1300000, transport_factor: 1.00, makanan_factor: 1.00 },
  Banjarmasin:      { umr: 3150000, avg_kos: 1200000, transport_factor: 0.95, makanan_factor: 0.95 },
  Pekanbaru:        { umr: 3500000, avg_kos: 1300000, transport_factor: 1.00, makanan_factor: 1.00 },
  Batam:            { umr: 4500000, avg_kos: 1600000, transport_factor: 1.10, makanan_factor: 1.10 },
  Padang:           { umr: 2800000, avg_kos: 1000000, transport_factor: 0.90, makanan_factor: 0.85 },
  Manado:           { umr: 3700000, avg_kos: 1200000, transport_factor: 1.00, makanan_factor: 1.05 },
  Pontianak:        { umr: 2900000, avg_kos: 1100000, transport_factor: 0.95, makanan_factor: 0.95 },
  Jayapura:         { umr: 4000000, avg_kos: 1800000, transport_factor: 1.30, makanan_factor: 1.40 },
  Kupang:           { umr: 2200000, avg_kos:  900000, transport_factor: 1.00, makanan_factor: 1.00 },
  Ambon:            { umr: 3200000, avg_kos: 1100000, transport_factor: 1.10, makanan_factor: 1.10 },
  Mataram:          { umr: 2450000, avg_kos:  900000, transport_factor: 0.90, makanan_factor: 0.88 },
  'Bandar Lampung': { umr: 2800000, avg_kos: 1000000, transport_factor: 0.90, makanan_factor: 0.88 },
  Jambi:            { umr: 3000000, avg_kos: 1000000, transport_factor: 0.90, makanan_factor: 0.90 },
  Bengkulu:         { umr: 2500000, avg_kos:  900000, transport_factor: 0.90, makanan_factor: 0.88 },
  Palangkaraya:     { umr: 3300000, avg_kos: 1200000, transport_factor: 1.00, makanan_factor: 1.00 },
  Kendari:          { umr: 3000000, avg_kos: 1100000, transport_factor: 1.00, makanan_factor: 1.00 },
  Palu:             { umr: 2800000, avg_kos: 1000000, transport_factor: 1.00, makanan_factor: 0.95 },
  Gorontalo:        { umr: 2800000, avg_kos: 1000000, transport_factor: 1.00, makanan_factor: 0.95 },
  Ternate:          { umr: 3200000, avg_kos: 1100000, transport_factor: 1.10, makanan_factor: 1.10 },
  Sorong:           { umr: 4000000, avg_kos: 1600000, transport_factor: 1.20, makanan_factor: 1.30 },
  Cirebon:          { umr: 2500000, avg_kos: 1000000, transport_factor: 0.90, makanan_factor: 0.85 },
  Serang:           { umr: 2700000, avg_kos: 1100000, transport_factor: 0.95, makanan_factor: 0.90 },
  Cilegon:          { umr: 4500000, avg_kos: 1500000, transport_factor: 1.00, makanan_factor: 1.00 },
  Sukabumi:         { umr: 2500000, avg_kos:  900000, transport_factor: 0.90, makanan_factor: 0.85 },
  Tasikmalaya:      { umr: 2100000, avg_kos:  800000, transport_factor: 0.85, makanan_factor: 0.82 },
  Purwokerto:       { umr: 2000000, avg_kos:  800000, transport_factor: 0.85, makanan_factor: 0.80 },
  Magelang:         { umr: 2100000, avg_kos:  800000, transport_factor: 0.85, makanan_factor: 0.82 },
  Kediri:           { umr: 2200000, avg_kos:  850000, transport_factor: 0.85, makanan_factor: 0.83 },
  Blitar:           { umr: 2000000, avg_kos:  800000, transport_factor: 0.85, makanan_factor: 0.82 },
  Madiun:           { umr: 2000000, avg_kos:  800000, transport_factor: 0.85, makanan_factor: 0.82 },
  Probolinggo:      { umr: 2100000, avg_kos:  850000, transport_factor: 0.88, makanan_factor: 0.85 },
  Mojokerto:        { umr: 2300000, avg_kos:  900000, transport_factor: 0.90, makanan_factor: 0.85 },
  Jember:           { umr: 2400000, avg_kos:  900000, transport_factor: 0.90, makanan_factor: 0.85 },
  Banyuwangi:       { umr: 2400000, avg_kos:  900000, transport_factor: 0.90, makanan_factor: 0.85 },
  'Pare-pare':      { umr: 2800000, avg_kos: 1000000, transport_factor: 0.95, makanan_factor: 0.90 },
  Bitung:           { umr: 3500000, avg_kos: 1100000, transport_factor: 1.00, makanan_factor: 1.00 },
  Tomohon:          { umr: 3000000, avg_kos: 1000000, transport_factor: 0.95, makanan_factor: 0.95 },
  Tarakan:          { umr: 3500000, avg_kos: 1400000, transport_factor: 1.10, makanan_factor: 1.15 },
  Bontang:          { umr: 3500000, avg_kos: 1300000, transport_factor: 1.05, makanan_factor: 1.05 },
};
const CITY_KB_DEFAULT = { umr: 3000000, avg_kos: 1200000, transport_factor: 1.0, makanan_factor: 1.0 };

// ─── Kategori → bucket 50/30/20 ───────────────────────────────────────────────
const KEBUTUHAN = [
  'Makanan & Minuman', 'Makanan', 'Perumahan', 'Kost', 'Transportasi',
  'Tagihan Tetap', 'Tagihan', 'Kesehatan', 'Pendidikan',
];
const TABUNGAN = ['Investasi', 'Tabungan', 'Investasi/Tabungan'];

function getBucket(cat) {
  if (KEBUTUHAN.includes(cat)) return 'kebutuhan';
  if (TABUNGAN.includes(cat))  return 'tabungan';
  return 'keinginan';
}

function getCityInfo(city) {
  return CITY_KB[city] ?? CITY_KB_DEFAULT;
}

// ─── Layer 1: Rule-based 50/30/20 engine ──────────────────────────────────────
function computeRuleBasedBudget(pendapatan, tagihaTetap, categoryRatio) {
  const disposable = pendapatan - tagihaTetap;
  const pctTagihan = pendapatan > 0 ? tagihaTetap / pendapatan : 0;
  const flags      = [];

  if (pctTagihan > 0.50) flags.push('TAGIHAN_TINGGI: tagihan melebihi 50% pendapatan');

  let kebutuhanPct = 0.50;
  let keinginanPct = 0.30;
  let tabunganPct  = 0.20;

  if (pctTagihan > 0.50) {
    keinginanPct = Math.max(0.05, keinginanPct - (pctTagihan - 0.50));
    tabunganPct  = Math.max(0.05, 1 - kebutuhanPct - keinginanPct);
  }
  if (tabunganPct < 0.10) {
    keinginanPct = Math.max(0.05, keinginanPct - (0.10 - tabunganPct));
    tabunganPct  = 0.10;
    flags.push('TABUNGAN_RENDAH: disesuaikan ke 10%');
  }

  const alokasiKebutuhan = disposable * kebutuhanPct;
  const alokasiKeinginan = disposable * keinginanPct;
  const alokasiTabungan  = disposable * tabunganPct;

  // Distribusi ke sub-kategori berdasarkan bobot historis
  const alokasi = {};
  const bucketWeights = { kebutuhan: {}, keinginan: {}, tabungan: {} };

  for (const [cat, w] of Object.entries(categoryRatio)) {
    bucketWeights[getBucket(cat)][cat] = w;
  }

  const bucketMap = [
    ['kebutuhan', alokasiKebutuhan, ['Makanan & Minuman', 'Perumahan', 'Transportasi']],
    ['keinginan', alokasiKeinginan, ['Hiburan', 'Belanja']],
    ['tabungan',  alokasiTabungan,  ['Tabungan']],
  ];

  for (const [bucket, totalAlloc, fallbackCats] of bucketMap) {
    const weights = bucketWeights[bucket];
    const sum     = Object.values(weights).reduce((s, v) => s + v, 0);

    if (sum === 0) {
      // Fallback: bagi rata ke default kategori bucket
      const share = totalAlloc / fallbackCats.length;
      for (const c of fallbackCats) alokasi[c] = Math.round((alokasi[c] ?? 0) + share);
    } else {
      for (const [cat, w] of Object.entries(weights)) {
        alokasi[cat] = Math.round(totalAlloc * (w / sum));
      }
    }
  }

  return {
    disposable,
    flags,
    kebutuhan: Math.round(alokasiKebutuhan),
    keinginan: Math.round(alokasiKeinginan),
    tabungan:  Math.round(alokasiTabungan),
    kebutuhanPct,
    keinginanPct,
    tabunganPct,
    alokasi_per_kategori: alokasi,
  };
}

// ─── Derive persona dari expense_to_income_ratio ──────────────────────────────
function derivePersona(ratio) {
  const pct = (ratio ?? 0) * 100;
  if (pct < 75)  return 'Aman';
  if (pct < 100) return 'Perlu Dipantau';
  if (pct < 150) return 'Waspada Overspending';
  return 'Kritis';
}

// ─── Layer 4: Build LLM prompt (identik dengan notebook) ─────────────────────
function buildLlmPrompt({ pendapatan, kota, persona, l1, prediksiPct, cityInfo }) {
  const bracket =
    pendapatan < 3e6  ? '< 3jt'  :
    pendapatan < 5e6  ? '3–5jt'  :
    pendapatan < 8e6  ? '5–8jt'  :
    pendapatan < 15e6 ? '8–15jt' : '> 15jt';

  const top3 = Object.entries(l1.alokasi_per_kategori)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `  • ${k}: ${((v / pendapatan) * 100).toFixed(1)}%`)
    .join('\n');

  const systemPrompt =
    'Kamu adalah financial planner Indonesia yang memahami konteks lokal tiap kota. ' +
    'Gunakan bahasa Indonesia yang ramah, tidak menghakimi, dan mudah dipahami oleh kalangan umum. ' +
    'Berikan saran yang actionable dan spesifik untuk kota user.';

  const userPrompt = `Synthesize rekomendasi budget berikut menjadi laporan personal:

DATA USER:
- Bracket pendapatan : ${bracket}
- Kota               : ${kota}
- Persona finansial  : ${persona}
- UMR kota           : Rp${cityInfo.umr.toLocaleString('id-ID')}
- Rata-rata kos      : Rp${cityInfo.avg_kos.toLocaleString('id-ID')}
- Transportasi mahal : ${cityInfo.transport_factor > 1.0 ? 'Ya' : 'Tidak'}
- Makanan mahal      : ${cityInfo.makanan_factor > 1.0 ? 'Ya' : 'Tidak'}

ALOKASI BUDGET (REKOMENDASI):
- Kebutuhan  : ${(l1.kebutuhanPct * 100).toFixed(0)}% dari pendapatan
- Keinginan  : ${(l1.keinginanPct * 100).toFixed(0)}% dari pendapatan
- Tabungan   : ${(l1.tabunganPct  * 100).toFixed(0)}% dari pendapatan
- Top 3 kategori terbesar:
${top3}
${prediksiPct != null ? `\nPREDIKSI BULAN DEPAN: ${prediksiPct}% dari pendapatan` : ''}
${l1.flags.length   ? `\nPERINGATAN: ${l1.flags.join('; ')}` : ''}

OUTPUT YANG DIINGINKAN (balas dengan JSON saja, tanpa teks atau markdown di luar JSON):
{
  "analisis": "<3 kalimat kondisi keuangan>",
  "tabel_budget": [{ "kategori": "...", "alokasi_pct": "...", "tips": "..." }],
  "tips_lokal": ["<tips spesifik kota 1>", "<tips spesifik kota 2>"],
  "proyeksi": "<narasi proyeksi jika budget diikuti>"
}

PENTING: Jangan sebut nilai Rp mentah. Gunakan persentase dan bahasa kontekstual.`;

  return { systemPrompt, userPrompt };
}

// ─── getBudgetRecommendation (AutoBudgeting Model) ────────────────────────────
const { getAutoBudgetRecommendation } = require('./model2Service');

async function getBudgetRecommendation(userId) {
  const month = currentMonth();
  return getAutoBudgetRecommendation(userId, month);
}
// ─── getSpendingLabel (Model 1 — Spending Persona Classifier) ─────────────────
const { getSpendingPersona } = require('./model1Service');

async function getSpendingLabel(userId, month) {
  return getSpendingPersona(userId, month);
}

// ─── predictNextMonthExpense ──────────────────────────────────────────────────
async function predictNextMonthExpense(userId) {
  if (!AI_SERVICE_URL) {
    throw new Error('AI_SERVICE_URL is not configured in environment variables');
  }

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

  const rows        = [...data].reverse();
  const workingRows = rows.length === 4 ? rows.slice(1) : rows;
  const extraRow    = rows.length === 4 ? rows[0] : null;

  function buildRow(row, ratioLast) {
    const [yearStr, monthStr] = row.month.split('-');
    const isOverspending = (row.total_expense ?? 0) > (row.monthly_income ?? 0) ? 1 : 0;
    return [
      parseInt(monthStr, 10),
      parseInt(yearStr,  10),
      row.total_expense           ?? 0,
      row.transaction_count       ?? 0,
      row.avg_transaction_value   ?? 0,
      isOverspending,
      row.monthly_income          ?? 0,
      row.spending_growth_rate    ?? 0,
      row.last_month_expense      ?? 0,
      row.avg_3month_expense      ?? 0,
      row.expense_to_income_ratio ?? 0,
      ratioLast                   ?? 0,
    ];
  }

  const EMPTY_ROW = Array(12).fill(0);
  const features  = [];

  for (let i = 0; i < workingRows.length; i++) {
    const prevRow   = i === 0 ? extraRow : workingRows[i - 1];
    const ratioLast = prevRow?.expense_to_income_ratio ?? 0;
    features.push(buildRow(workingRows[i], ratioLast));
  }

  while (features.length < 3) features.unshift(EMPTY_ROW);

  if (
    features.length !== 3 ||
    features.some((row) => !Array.isArray(row) || row.length !== 12) ||
    features.some((row) => row.some((v) => typeof v !== 'number' || isNaN(v)))
  ) {
    throw new Error(`Invalid features shape: expected (3, 12)`);
  }

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

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI service returned ${response.status}: ${errText}`);
  }

  const result = await response.json();

  if (!result?.success || !Array.isArray(result?.predictions)) {
    throw new Error(`AI service response malformed: ${JSON.stringify(result).slice(0, 200)}`);
  }

  return result;
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

module.exports = {
  getBudgetRecommendation,
  getSpendingLabel,
  predictNextMonthExpense,
};