/**
 * @file src/utils/validate.js
 * @description Lightweight validation helpers shared across controllers.
 */

/**
 * Check that every field name in `fields` is present and non-empty in `body`.
 *
 * A field is considered missing when its value is:
 *   - undefined or null
 *   - an empty string (after trimming)
 *
 * Numbers and booleans (including 0 and false) are treated as valid values.
 *
 * @param {object}   body    - Request body object (req.body)
 * @param {string[]} fields  - Field names that must be present
 * @returns {string[]}       - Array of missing field names; empty if all present
 *
 * @example
 * const missing = validateRequired(req.body, ['name', 'city']);
 * if (missing.length) {
 *   return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
 * }
 */
function validateRequired(body, fields) {
  return fields.filter((field) => {
    const val = body[field];
    if (val === undefined || val === null) return true;       // absent
    if (typeof val === 'string' && val.trim() === '') return true; // blank string
    return false;
  });
}

module.exports = { validateRequired };