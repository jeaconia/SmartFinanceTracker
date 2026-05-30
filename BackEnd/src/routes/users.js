/**
 * @file src/routes/users.js
 * @description User profile routes. Mounted at /api/users (auth applied by app.js).
 */

const express = require('express');
const router  = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');

/**
 * GET /api/users/me
 * @summary  Return the authenticated user's profile from public.users.
 * @access   Private (Bearer token required)
 * @returns  {object} { success: true, data: UserProfile }
 */
router.get('/me', getProfile);

/**
 * PUT /api/users/me
 * @summary  Update the authenticated user's profile.
 * @access   Private (Bearer token required)
 * @body     {string}  [name]          Display name
 * @body     {string}  [city]          City of residence (affects UMR lookup)
 * @body     {string}  [province]      Province
 * @body     {number}  [umr_value]     Regional minimum wage (IDR, >= 0)
 * @body     {boolean} [notif_enabled] Whether push/email notifications are enabled
 * @body     {string}  [currency]      Preferred display currency code (e.g. "IDR")
 * @returns  {object} { success: true, data: UpdatedUserProfile }
 */
router.put('/me', updateProfile);

module.exports = router;