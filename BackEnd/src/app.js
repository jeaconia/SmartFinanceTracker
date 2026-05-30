/**
 * @file src/app.js
 * @description Express application factory.
 *
 * Route mounting order (important):
 *   1. Global middleware  (CORS, body parsers)
 *   2. Public routes      (/health — no auth)
 *   3. Protected routes   (/api/* — all behind authenticate middleware)
 *   4. 404 catch-all
 *   5. Global error handler
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const authenticate = require('./middleware/auth');

// ── Route modules ──────────────────────────────────────────────────────────────
const usersRouter         = require('./routes/users');
const transactionsRouter  = require('./routes/transactions');
const budgetsRouter       = require('./routes/budgets');
const recurringRouter     = require('./routes/recurring');
const analyticsRouter     = require('./routes/analytics');
const notificationsRouter = require('./routes/notifications');
const aiRouter            = require('./routes/ai');

const app = express();

// ── 1. Global Middleware ───────────────────────────────────────────────────────

app.use(cors({
  origin:         process.env.FRONTEND_URL || '*',
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 2. Public Routes (no auth) ─────────────────────────────────────────────────

/**
 * GET /health
 * @summary  Liveness probe — used by load balancers and uptime monitors.
 * @access   Public
 * @returns  {{ status: "ok", timestamp: string, version: string }}
 */
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    version:   '1.0.0',
  });
});

// ── 3. Protected Routes (/api/*) ───────────────────────────────────────────────
// All routes below require a valid Supabase JWT in the Authorization header.
// The authenticate middleware attaches the decoded user to req.user.

/** @see src/controllers/userController.js */
app.use('/api/users',         authenticate, usersRouter);

/** @see src/controllers/transactionController.js */
app.use('/api/transactions',  authenticate, transactionsRouter);

/** @see src/controllers/budgetController.js */
app.use('/api/budgets',       authenticate, budgetsRouter);

/** @see src/controllers/recurringController.js */
app.use('/api/recurring',     authenticate, recurringRouter);

/** @see src/controllers/analyticsController.js */
app.use('/api/analytics',     authenticate, analyticsRouter);

/** @see src/controllers/notificationController.js */
app.use('/api/notifications', authenticate, notificationsRouter);

/** @see src/controllers/aiController.js */
app.use('/api/ai',            authenticate, aiRouter);

// ── 4. 404 Handler ─────────────────────────────────────────────────────────────
// Catches any request that did not match a registered route.
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── 5. Global Error Handler ────────────────────────────────────────────────────
// Express identifies this as an error handler via the 4-argument signature (err, req, res, next).
// Any controller that calls next(err) — or throws inside an async handler wrapped with a
// try/catch that calls next(err) — will land here.
//
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Always log the full error server-side; never expose stack traces to clients.
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  res.status(err.status || 500).json({
    success: false,
    error:   err.status ? err.message : 'Internal server error',
  });
});

module.exports = app;