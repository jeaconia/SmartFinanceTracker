const supabase = require('../config/supabase');

/**
 * Middleware: verify Supabase JWT from Authorization header.
 * Attaches the authenticated user to req.user on success.
 *
 * Expected header: Authorization: Bearer <access_token>
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token not provided' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  // Attach the full Supabase user object — controllers access req.user.id
  req.user = data.user;
  next();
}

module.exports = authenticate;
