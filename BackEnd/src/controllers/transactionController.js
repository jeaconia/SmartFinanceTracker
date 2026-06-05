const supabase = require('../config/supabase');
const { upsertMonthlyAnalytics } = require('../services/analyticsService');

const VALID_CATEGORIES = [
  'Makanan & Minuman', 'Belanja', 'Transportasi', 'Tagihan Tetap',
  'Kesehatan', 'Hiburan', 'Pendidikan', 'Pakaian', 'Sosial',
  'Olahraga', 'Traveling', 'Elektronik', 'Kost', 'Anak-Anak', 'Hewan Peliharaan'
];
const VALID_INCOME_CATEGORIES = ['Gaji', 'Hadiah', 'THR', 'Reimburse', 'Investasi'];
const VALID_TYPES      = ['income', 'expense'];

/** Derive 'YYYY-MM' from a date string 'YYYY-MM-DD' */
function monthFromDate(dateStr) {
  return dateStr.substring(0, 7);
}

function monthEndDate(month) {
  const [year, mo] = month.split('-').map(Number);
  const lastDay = new Date(year, mo, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

// ── POST /api/transactions ────────────────────────────────────────────────────
async function createTransaction(req, res) {
  const { type, amount, category, description, date, is_recurring, recurring_id } = req.body;
  const userId = req.user.id;

  // Validation
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, error: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, error: 'amount must be a positive number' });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, error: 'date is required in YYYY-MM-DD format' });
  }
  if (type === 'expense') {
    if (!category) {
      return res.status(400).json({ success: false, error: 'category is required for expense transactions' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
  }
  if (type === 'income' && category && !VALID_INCOME_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, error: `income category must be one of: ${VALID_INCOME_CATEGORIES.join(', ')}` });
  }

  const payload = {
    user_id: userId,
    type,
    amount,
    date,
    description: description || null,
    category: category || null,
    is_recurring: is_recurring || false,
    recurring_id: recurring_id || null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[createTransaction]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // Fire-and-forget analytics update
  upsertMonthlyAnalytics(userId, monthFromDate(date));

  return res.status(201).json({ success: true, data });
}

// ── GET /api/transactions ─────────────────────────────────────────────────────
async function listTransactions(req, res) {
  const userId = req.user.id;
  const { type, category, month, year } = req.query;
  const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && VALID_TYPES.includes(type))              query = query.eq('type', type);
  if (category && VALID_CATEGORIES.includes(category)) query = query.eq('category', category);
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    query = query
      .gte('date', `${month}-01`)
      .lte('date', monthEndDate(month));
  }
  if (year && /^\d{4}$/.test(year)) {
    query = query
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[listTransactions]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({
    success: true,
    data,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  });
}

// ── GET /api/transactions/:id ─────────────────────────────────────────────────
async function getTransaction(req, res) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) {
    console.error('[getTransaction]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
  if (!data) return res.status(404).json({ success: false, error: 'Transaction not found' });

  return res.json({ success: true, data });
}

// ── PUT /api/transactions/:id ─────────────────────────────────────────────────
async function updateTransaction(req, res) {
  const userId = req.user.id;
  const { id }  = req.params;

  // Fetch existing to get the date (for analytics re-trigger)
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('date, type')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ success: false, error: fetchError.message });
  if (!existing)  return res.status(404).json({ success: false, error: 'Transaction not found' });

  const { amount, category, description, date } = req.body;

  // Build update payload — only allowed fields
  const updates = {};
  if (amount !== undefined) {
    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ success: false, error: 'amount must be a positive number' });
    updates.amount = amount;
  }
  if (category !== undefined) {
    if (existing.type === 'expense' && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (existing.type === 'income' && !VALID_INCOME_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: `income category must be one of: ${VALID_INCOME_CATEGORIES.join(', ')}` });
    }
    updates.category = category;
  }
  if (description !== undefined) updates.description = description;
  if (date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ success: false, error: 'date must be in YYYY-MM-DD format' });
    updates.date = date;
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ success: false, error: 'No valid fields to update' });

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateTransaction]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  // Re-trigger analytics for original month and new month (if date changed)
  const originalMonth = monthFromDate(existing.date);
  const newMonth      = monthFromDate(updates.date || existing.date);
  upsertMonthlyAnalytics(userId, newMonth);
  if (originalMonth !== newMonth) upsertMonthlyAnalytics(userId, originalMonth);

  return res.json({ success: true, data });
}

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────
async function deleteTransaction(req, res) {
  const userId = req.user.id;
  const { id }  = req.params;

  // Fetch first to get date for analytics
  const { data: existing, error: fetchError } = await supabase
    .from('transactions')
    .select('date')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ success: false, error: fetchError.message });
  if (!existing)  return res.status(404).json({ success: false, error: 'Transaction not found' });

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[deleteTransaction]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  upsertMonthlyAnalytics(userId, monthFromDate(existing.date));

  return res.json({ success: true, data: { message: 'Transaction deleted' } });
}

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
};