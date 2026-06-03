/**
 * @file src/controllers/userController.js
 * @description Handles reading and updating the authenticated user's profile.
 *
 * Routes (mounted under /api/users by app.js):
 *   GET  /api/users/me  — fetch own profile
 *   PUT  /api/users/me  — update own profile
 */

const supabase     = require('../config/supabase');
const aiService    = require('../services/aiService');
const { validateRequired } = require('../utils/validate');

// Tambahkan di bagian atas file, setelah require statements:

const CITY_UMR = {
  Jakarta: 5441000, Surabaya: 4525000, Bandung: 4209000, Medan: 3800000,
  Semarang: 3243000, Makassar: 3800000, Palembang: 3600000, Tangerang: 4700000,
  Depok: 4700000, Bekasi: 5500000, Bogor: 4639000, Yogyakarta: 2300000,
  Solo: 2300000, Malang: 3294000, Denpasar: 3000000, Balikpapan: 3300000,
  Samarinda: 3200000, Banjarmasin: 3150000, Pekanbaru: 3500000, Batam: 4500000,
  Padang: 2800000, Manado: 3700000, Pontianak: 2900000, Jayapura: 4000000,
  Kupang: 2200000, Ambon: 3200000, Mataram: 2450000, 'Bandar Lampung': 2800000,
  Jambi: 3000000, Bengkulu: 2500000, Palangkaraya: 3300000, Kendari: 3000000,
  Palu: 2800000, Gorontalo: 2800000, Ternate: 3200000, Sorong: 4000000,
  Cirebon: 2500000, Serang: 2700000, Cilegon: 4500000, Sukabumi: 2500000,
  Tasikmalaya: 2100000, Purwokerto: 2000000, Magelang: 2100000, Kediri: 2200000,
  Blitar: 2000000, Madiun: 2000000, Probolinggo: 2100000, Mojokerto: 2300000,
  Jember: 2400000, Banyuwangi: 2400000, 'Pare-pare': 2800000, Bitung: 3500000,
  Tomohon: 3000000, Tarakan: 3500000, Bontang: 3500000,
};

// Columns the client is allowed to set. Any other key in req.body is ignored.
const UPDATABLE_FIELDS = ['name', 'city', 'province', 'umr_value', 'notif_enabled', 'currency'];

/** Current month as 'YYYY-MM' */
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── GET /api/users/me ──────────────────────────────────────────────────────────
/**
 * Return the current user's row from public.users.
 *
 * If no row exists yet (e.g. first login before a trigger has inserted one),
 * the handler returns a minimal shape derived from the auth token rather than a 404.
 */
async function getProfile(req, res) {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getProfile]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  if (!data) {
    // Profile row not yet created — return minimal auth-derived info
    return res.json({
      success: true,
      data: {
        id:            userId,
        email:         req.user.email ?? null,
        name:          req.user.user_metadata?.full_name ?? null,
        city:          null,
        province:      null,
        umr_value:     null,
        notif_enabled: true,
        currency:      'IDR',
      },
    });
  }

  return res.json({ success: true, data });
}

// ── PUT /api/users/me ──────────────────────────────────────────────────────────
/**
 * Update the current user's profile.
 *
 * Accepted fields: name, city, province, umr_value, notif_enabled, currency.
 * At least one field must be provided.
 *
 * Side-effect (fire-and-forget): if city or umr_value changed, regenerate
 * the AI budget recommendation and upsert it into ai_results for the current month.
 */
async function updateProfile(req, res) {
  const userId = req.user.id;

  // Build a sanitised update payload — only whitelisted fields, only provided keys
  const updates = {};
  for (const field of UPDATABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: `At least one updatable field required: ${UPDATABLE_FIELDS.join(', ')}`,
    });
  }

  // Type validations for sensitive numeric / boolean fields
  if (updates.umr_value !== undefined && updates.umr_value !== null) {
    const n = Number(updates.umr_value);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ success: false, error: 'umr_value must be a non-negative number' });
    }
    updates.umr_value = n;
  }

  if (updates.notif_enabled !== undefined && typeof updates.notif_enabled !== 'boolean') {
    return res.status(400).json({ success: false, error: 'notif_enabled must be a boolean' });
  }

  // Fetch existing profile to detect changes that should trigger AI refresh
  const { data: existing } = await supabase
    .from('users')
    .select('city, umr_value')
    .eq('id', userId)
    .maybeSingle();
  
  // Auto-assign umr_value dari CITY_KB jika city diubah dan user tidak eksplisit kirim umr_value
  if ('city' in updates && !('umr_value' in updates)) {
    const cityUmr = CITY_UMR[updates.city];
    if (cityUmr) {
      updates.umr_value = cityUmr;
    }
  }
 
  // Upsert — creates the row if it doesn't exist yet
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { 
        id: userId, 
        email: req.user.email,  // ← tambahkan ini
        ...updates, 
        updated_at: new Date().toISOString() 
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[updateProfile]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // ── Side-effect: refresh AI budget recommendation if location/income changed ──
  const cityChanged    = 'city'      in updates && updates.city      !== existing?.city;
  const umrChanged     = 'umr_value' in updates && updates.umr_value !== existing?.umr_value;

  if (cityChanged || umrChanged) {
    // Fire-and-forget — never block the HTTP response for this
    refreshBudgetRecommendation(userId).catch((err) =>
      console.error('[updateProfile] refreshBudgetRecommendation failed:', err.message)
    );
  }

  return res.json({ success: true, data });
}

/**
 * Regenerate the AI budget recommendation and store it in ai_results.
 * Called fire-and-forget after profile changes affecting location or UMR.
 *
 * @param {string} userId
 */
async function refreshBudgetRecommendation(userId) {
  const result = await aiService.getBudgetRecommendation(userId);

  const { error } = await supabase
    .from('ai_results')
    .upsert(
      {
        user_id:                      userId,
        month:                        currentMonth(),
        budget_recommendation:        result.recommendations,
        recommendation_based_on_city: result.based_on_city,
        recommendation_based_on_umr:  result.based_on_umr,
      },
      { onConflict: 'user_id,month' }
    );

  if (error) {
    console.error('[refreshBudgetRecommendation] upsert failed:', error.message);
  } else {
    console.log(`[refreshBudgetRecommendation] Refreshed for user ${userId}`);
  }
}

module.exports = { getProfile, updateProfile };