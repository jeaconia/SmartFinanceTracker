const supabase = require('../config/supabase');

// ─── GET /api/notifications ───────────────────────────────────────────────────
/**
 * List the current user's notifications.
 * Optional query param: ?is_read=false  → only unread
 * Always ordered by created_at DESC, max 50 rows.
 */
async function listNotifications(req, res) {
  const userId = req.user.id;
  const { is_read } = req.query;

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Apply is_read filter only when explicitly supplied and parseable
  if (is_read === 'true')  query = query.eq('is_read', true);
  if (is_read === 'false') query = query.eq('is_read', false);

  const { data, error } = await query;

  if (error) {
    console.error('[listNotifications]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

// ─── GET /api/notifications/unread-count ──────────────────────────────────────
/**
 * Return the number of unread notifications for the current user.
 * Response: { count: N }
 */
async function getUnreadCount(req, res) {
  const userId = req.user.id;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true }) // HEAD request — no rows returned, just count
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[getUnreadCount]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, count: count ?? 0 });
}

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
/**
 * Mark a single notification as read.
 * Enforces ownership — users can only mark their own notifications.
 */
async function markAsRead(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId) // ownership guard
    .select()
    .single();

  if (error) {
    // PostgREST returns PGRST116 when .single() finds no row
    if (error.code === 'PGRST116') {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    console.error('[markAsRead]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
/**
 * Mark ALL of the current user's notifications as read in one shot.
 */
async function markAllAsRead(req, res) {
  const userId = req.user.id;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false); // only touch rows that are still unread (minor perf optimisation)

  if (error) {
    console.error('[markAllAsRead]', error);
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: 'All notifications marked as read' });
}

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};