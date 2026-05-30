const cron = require('node-cron');
const supabase = require('../config/supabase');
const { sendOverbudgetEmail, sendRecurringReminderEmail } = require('../services/emailService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date at midnight UTC as an ISO string — used for "sent today" checks. */
function todayUTCStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Format a Date (or ISO string) for display in Indonesian locale.
 * e.g. "15 Juni 2025"
 */
function formatDateID(dateInput) {
  return new Date(dateInput).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Format YYYY-MM to an Indonesian month label.
 * e.g. "2025-06" → "Juni 2025"
 */
function formatMonthID(yyyyMm) {
  const [year, month] = yyyyMm.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

/** Fetch a user's email + display name from auth.users via the service-role client. */
async function getUserDetails(userId) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    console.error(`[scheduler] getUserDetails(${userId}):`, error?.message);
    return null;
  }
  const { email, user_metadata } = data.user;
  const name =
    user_metadata?.full_name ||
    user_metadata?.name ||
    email?.split('@')[0] ||
    'Pengguna';
  return { email, name };
}

/**
 * Check whether a notification of a given type was already sent today
 * for a specific related record (budget or recurring expense).
 *
 * @param {string} type       'overbudget' | 'recurring_reminder'
 * @param {string} relatedId  UUID of the budget / recurring expense row
 * @returns {boolean}
 */
async function alreadySentToday(type, relatedId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('type', type)
    .eq('related_id', relatedId)
    .gte('created_at', todayUTCStart())
    .limit(1);

  if (error) {
    console.error(`[scheduler] alreadySentToday(${type}, ${relatedId}):`, error.message);
    return false; // fail-open: allow send so we don't silently swallow alerts
  }
  return data.length > 0;
}

/**
 * Insert a row into the notifications table.
 */
async function insertNotification({ userId, type, title, message, relatedId, relatedTable }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    related_id: relatedId,
    related_table: relatedTable,
    is_read: false,
  });
  if (error) {
    console.error(`[scheduler] insertNotification(${type}):`, error.message);
  }
}

// ─── Job 1: Overbudget Check ──────────────────────────────────────────────────
// Cron: "0 1 * * *"
//   minute=0, hour=1 UTC  →  08:00 WIB (UTC+7)
//   Runs every day at 08:00 Jakarta time.
async function runOverbudgetCheck() {
  console.log('[scheduler] [overbudgetCheck] Starting…');

  // Fetch all overbudget rows from the budget_status VIEW
  const { data: overbudgetRows, error } = await supabase
    .from('budget_status')
    .select('*')
    .eq('is_overbudget', true);

  if (error) {
    console.error('[scheduler] [overbudgetCheck] Query failed:', error.message);
    return;
  }

  console.log(`[scheduler] [overbudgetCheck] Found ${overbudgetRows.length} overbudget budget(s)`);

  for (const row of overbudgetRows) {
    const {
      id: budgetId,      // PK of the budget row
      user_id: userId,
      category,
      limit_amount,
      used_amount,       // from budget_status view
      month,             // YYYY-MM
    } = row;

    try {
      // Deduplicate: skip if we already sent an overbudget notification today
      const alreadySent = await alreadySentToday('overbudget', budgetId);
      if (alreadySent) {
        console.log(`[scheduler] [overbudgetCheck] Already notified today for budget ${budgetId} — skipping`);
        continue;
      }

      const monthLabel = formatMonthID(month);
      const title = `Anggaran ${category} Terlampaui`;
      const message = `Pengeluaran ${category} bulan ${monthLabel} telah melebihi anggaran yang ditetapkan.`;

      // 1) Persist notification to DB
      await insertNotification({
        userId,
        type: 'overbudget',
        title,
        message,
        relatedId: budgetId,
        relatedTable: 'budgets',
      });

      // 2) Get user contact details
      const user = await getUserDetails(userId);
      if (!user?.email) {
        console.warn(`[scheduler] [overbudgetCheck] No email for user ${userId} — skipping email`);
        continue;
      }

      // 3) Send email
      await sendOverbudgetEmail(
        user.email,
        user.name,
        category,
        used_amount,
        limit_amount,
        monthLabel
      );

      console.log(`[scheduler] [overbudgetCheck] Notified ${user.email} for ${category} (${monthLabel})`);
    } catch (err) {
      // Never let a single failure crash the whole loop
      console.error(`[scheduler] [overbudgetCheck] Error for budget ${budgetId}:`, err.message);
    }
  }

  console.log('[scheduler] [overbudgetCheck] Done.');
}

// ─── Job 2: Recurring Reminder ────────────────────────────────────────────────
// Cron: "0 0 * * *"
//   minute=0, hour=0 UTC  →  07:00 WIB (UTC+7)
//   Runs every day at 07:00 Jakarta time.
async function runRecurringReminder() {
  console.log('[scheduler] [recurringReminder] Starting…');

  // Pull active recurring expenses where next_due_date is within reminder_days_before days.
  // We do the window comparison in JS after fetching to keep the query simple and compatible
  // with Supabase's PostgREST query language.
  //
  // Alternatively, the raw SQL equivalent would be:
  //   WHERE is_active = true AND next_due_date <= NOW() + reminder_days_before * INTERVAL '1 day'
  //
  // Since PostgREST doesn't support per-row interval arithmetic in filters, we fetch all
  // active rows and filter client-side.
  const { data: activeRecurring, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[scheduler] [recurringReminder] Query failed:', error.message);
    return;
  }

  const now = new Date();

  // Filter: next_due_date <= now + reminder_days_before days
  const dueRows = activeRecurring.filter((row) => {
    const reminderDays = row.reminder_days_before ?? 1;
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + reminderDays);
    // next_due_date is YYYY-MM-DD; compare at day granularity
    return new Date(row.next_due_date) <= windowEnd;
  });

  console.log(`[scheduler] [recurringReminder] ${dueRows.length} reminder(s) to process`);

  for (const row of dueRows) {
    const {
      id: recurringId,
      user_id: userId,
      name: recurringName,
      amount,
      next_due_date,
    } = row;

    try {
      // Deduplicate: skip if reminder already sent today for this recurring expense
      const alreadySent = await alreadySentToday('recurring_reminder', recurringId);
      if (alreadySent) {
        console.log(`[scheduler] [recurringReminder] Already notified today for recurring ${recurringId} — skipping`);
        continue;
      }

      const dueDateLabel = formatDateID(next_due_date);
      const title = `Pengingat: ${recurringName}`;
      const message = `${recurringName} akan jatuh tempo pada ${dueDateLabel}.`;

      // 1) Persist notification to DB
      await insertNotification({
        userId,
        type: 'recurring_reminder',
        title,
        message,
        relatedId: recurringId,
        relatedTable: 'recurring_expenses',
      });

      // 2) Get user contact details
      const user = await getUserDetails(userId);
      if (!user?.email) {
        console.warn(`[scheduler] [recurringReminder] No email for user ${userId} — skipping email`);
        continue;
      }

      // 3) Send email
      await sendRecurringReminderEmail(
        user.email,
        user.name,
        recurringName,
        amount,
        dueDateLabel
      );

      console.log(`[scheduler] [recurringReminder] Reminded ${user.email} about "${recurringName}" due ${dueDateLabel}`);
    } catch (err) {
      console.error(`[scheduler] [recurringReminder] Error for recurring ${recurringId}:`, err.message);
    }
  }

  console.log('[scheduler] [recurringReminder] Done.');
}

// ─── startScheduler ───────────────────────────────────────────────────────────
/**
 * Register all cron jobs and start them.
 * Called once from server.js after the HTTP server starts listening.
 */
function startScheduler() {
  // ── Job 1: Overbudget check — 08:00 WIB daily ──────────────────────────────
  // Cron expression breakdown: "0 1 * * *"
  //   ┌── minute       (0)  → top of the hour
  //   │ ┌── hour        (1)  → 01:00 UTC = 08:00 WIB (UTC+7)
  //   │ │ ┌── day-of-month  (*) → every day
  //   │ │ │ ┌── month        (*) → every month
  //   │ │ │ │ ┌── day-of-week  (*) → every weekday
  //   │ │ │ │ │
  //   0 1 * * *
  cron.schedule('0 1 * * *', () => {
    runOverbudgetCheck().catch((err) =>
      console.error('[scheduler] [overbudgetCheck] Unhandled error:', err.message)
    );
  }, { timezone: 'UTC' });

  console.log('[scheduler] Job registered: overbudgetCheck @ 01:00 UTC (08:00 WIB)');

  // ── Job 2: Recurring reminder — 07:00 WIB daily ────────────────────────────
  // Cron expression breakdown: "0 0 * * *"
  //   ┌── minute       (0)  → top of the hour
  //   │ ┌── hour        (0)  → 00:00 UTC = 07:00 WIB (UTC+7)
  //   │ │ ┌── day-of-month  (*) → every day
  //   │ │ │ ┌── month        (*) → every month
  //   │ │ │ │ ┌── day-of-week  (*) → every weekday
  //   │ │ │ │ │
  //   0 0 * * *
  cron.schedule('0 0 * * *', () => {
    runRecurringReminder().catch((err) =>
      console.error('[scheduler] [recurringReminder] Unhandled error:', err.message)
    );
  }, { timezone: 'UTC' });

  console.log('[scheduler] Job registered: recurringReminder @ 00:00 UTC (07:00 WIB)');
}

module.exports = { startScheduler };