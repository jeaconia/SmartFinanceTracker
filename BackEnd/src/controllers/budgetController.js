const supabase = require('../config/supabase');

const VALID_CATEGORIES = ['Belanja', 'Kesehatan', 'Hiburan', 'Sosial', 'Hewan Peliharaan'];

// ── POST /api/budgets ─────────────────────────────────────────────────────────
async function createBudget(req, res) {
  const userId = req.user.id;
  const { category, limit_amount, month } = req.body;

  if (!category || !VALID_CATEGORIES.includes(category))
    return res.status(400).json({ success: false, error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  if (!limit_amount || typeof limit_amount !== 'number' || limit_amount <= 0)
    return res.status(400).json({ success: false, error: 'limit_amount must be a positive number' });
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return res.status(400).json({ success: false, error: 'month is required in YYYY-MM format' });

  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: userId, category, limit_amount, month },
      { onConflict: 'user_id,category,month' }
    )
    .select()
    .single();

  if (error) {
    console.error('[createBudget]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data });
}

// ── GET /api/budgets ──────────────────────────────────────────────────────────
// Joins budget_status view to include spending info per budget
async function listBudgets(req, res) {
  const userId = req.user.id;
  const { month } = req.query;

  // Query the budget_status view (includes all budget fields + used/remaining/overbudget)
  let query = supabase
    .from('budget_status')
    .select('*')
    .eq('user_id', userId)
    .order('category', { ascending: true });

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[listBudgets]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

// ── PUT /api/budgets/:id ──────────────────────────────────────────────────────
async function updateBudget(req, res) {
  const userId = req.user.id;
  const { id }  = req.params;
  const { limit_amount } = req.body;

  if (!limit_amount || typeof limit_amount !== 'number' || limit_amount <= 0)
    return res.status(400).json({ success: false, error: 'limit_amount must be a positive number' });

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('budgets')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ success: false, error: fetchError.message });
  if (!existing)  return res.status(404).json({ success: false, error: 'Budget not found' });

  const { data, error } = await supabase
    .from('budgets')
    .update({ limit_amount })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateBudget]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

// ── DELETE /api/budgets/:id ───────────────────────────────────────────────────
async function deleteBudget(req, res) {
  const userId = req.user.id;
  const { id }  = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('budgets')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ success: false, error: fetchError.message });
  if (!existing)  return res.status(404).json({ success: false, error: 'Budget not found' });

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[deleteBudget]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data: { message: 'Budget deleted' } });
}

module.exports = { createBudget, listBudgets, updateBudget, deleteBudget };
