const { supabase } = require('./supabaseService');

/**
 * Logs an authentication or role change event to auth_audit_logs
 * @param {Object} params
 * @param {string|null} params.userId - UUID of user involved
 * @param {string} params.eventType - login, signup, magic_link_sent, invite_sent, etc.
 * @param {Object} [params.metadata] - Extra metadata (roles, ip, etc.)
 * @param {import('express').Request} [params.req] - Express request object for IP and User-Agent
 */
async function logAuthEvent({ userId = null, eventType, metadata = {}, req = null }) {
  try {
    if (!supabase) return;

    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      userAgent = req.headers['user-agent'] || null;
    }

    const { error } = await supabase
      .from('auth_audit_logs')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        ip_address: ipAddress ? String(ipAddress).slice(0, 45) : null,
        user_agent: userAgent ? String(userAgent).slice(0, 255) : null,
      });

    if (error) {
      console.warn('[auditService] Failed to insert audit log:', error.message);
    }
  } catch (err) {
    console.warn('[auditService] Unexpected audit log error:', err.message);
  }
}

module.exports = { logAuthEvent };
