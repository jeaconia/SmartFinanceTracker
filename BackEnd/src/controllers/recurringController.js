const supabase = require('../config/supabase');

const VALID_CATEGORIES = ['Belanja', 'Kesehatan', 'Hiburan', 'Sosial', 'Hewan Peliharaan'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'];

// ── POST /api/recurring ───────────────────────────────────────────────────────
async function createRecurring(req, res) {
  const userId = req.user.id;
  const { name, amount, category, frequency, next_due_date, reminder_days_before } = req.body;

  if (!name || typeof name !== 'string' || !name.trim())
    return res.status(400).json({ success: false, error: 'name is required' });
  if (!amount || typeof amount !== 'number' || amount <= 0)
    return res.status(400).json({ success: false, error: 'amount must be a positive number' });
  if (!category || !VALID_CATEGORIES.includes(category))
    return res.status(400).json({ success: false, error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  if (!frequency || !VALID_FREQUENCIES.includes(frequency))
    return res.status(400).json({ success: false, error: `frequency must be one of: ${VALID_FREQUENCIES.join(', ')}` });
  if (!next_due_date || !/^\d{4}-\d{2}-\d{2}$/.test(next_due_date))
    return res.status(400).json({ success: false, error: 'next_due_date is required in YYYY-MM-DD format' });

  const payload = {
    user_id: userId,
    name: name.trim(),
    amount,
    category,
    frequency,
    next_due_date,
    reminder_days_before: reminder_days_before ?? 1,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[createRecurring]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data });
}

// ── GET /api/recurring ────────────────────────────────────────────────────────
async function listRecurring(req, res) {
  const userId = req.user.id;
  const { is_active } = req.query;

  let query = supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('next_due_date', { ascending: true });

  // Only apply filter if explicitly passed
  if (is_active === 'true')  query = query.eq('is_active', true);
  if (is_active === 'false') query = query.eq('is_active', false);

  const { data, error } = await query;

  if (error) {
    console.error('[listRecurring]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

// ── PUT /api/recurring/:id ────────────────────────────────────────────────────
async function updateRecurring(req, res) {
  const userId = req.user.id;
  const { id }  = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('recurring_expenses')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ success: false, error: fetchError.message });
  if (!existing)  return res.status(404).json({ success: false, error: 'Recurring expense not found' });

  const { name, amount, category, frequency, next_due_date, reminder_days_before, is_active } = req.body;
  const updates = {};

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ success: false, error: 'name cannot be empty' });
    updates.name = name.trim();
  }
  if (amount !== undefined) {
    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ success: false, error: 'amount must be a positive number' });
    updates.amount = amount;
  }
  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category))
      return res.status(400).json({ success: false, error: 'Invalid category' });
    updates.category = category;
  }
  if (frequency !== undefined) {
    if (!VALID_FREQUENCIES.includes(frequency))
      return res.status(400).json({ success: false, error: 'Invalid frequency' });
    updates.frequency = frequency;
  }
  if (next_due_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next_due_date))
      return res.status(400).json({ success: false, error: 'next_due_date must be in YYYY-MM-DD format' });
    updates.next_due_date = next_due_date;
  }
  if (reminder_days_before !== undefined) {
    if (typeof reminder_days_before !== 'number' || reminder_days_before < 0)
      return res.status(400).json({ success: false, error: 'reminder_days_before must be >= 0' });
    updates.reminder_days_before = reminder_days_before;
  }
  if (is_active !== undefined) {
    updates.is_active = Boolean(is_active);
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ success: false, error: 'No valid fields to update' });

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateRecurring]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

// ── DELETE /api/recurring/:id — soft delete ───────────────────────────────────
async function deleteRecurring(req, res) {
  const userId = req.user.id;
  const { id }  = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('recurring_expenses')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ success: false, error: fetchError.message });
  if (!existing)  return res.status(404).json({ success: false, error: 'Recurring expense not found' });

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[deleteRecurring]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data: { message: 'Recurring expense deactivated', record: data } });
}

// ── POST /api/recurring/:id/activate ─────────────────────────────────────────
async function activateRecurring(req, res) {
  const userId = req.user.id;
  const { id }  = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('recurring_expenses')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ success: false, error: fetchError.message });
  if (!existing)  return res.status(404).json({ success: false, error: 'Recurring expense not found' });

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update({ is_active: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[activateRecurring]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

module.exports = {
  createRecurring,
  listRecurring,
  updateRecurring,
  deleteRecurring,
  activateRecurring,
};
