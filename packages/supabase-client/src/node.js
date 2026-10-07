const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Creates a Supabase client for Node.js backend use with service role key
 * This is the canonical Supabase client for all backend services
 * @param {string} supabaseUrl - Supabase project URL (defaults to SUPABASE_URL env var)
 * @param {string} supabaseKey - Supabase service role key (defaults to SUPABASE_SERVICE_ROLE_KEY env var)
 * @returns {Object} Supabase client or null if credentials missing
 */
function createNodeClient(supabaseUrl, supabaseKey) {
  const url = supabaseUrl || process.env.SUPABASE_URL;
  const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('[createNodeClient] Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Singleton instance for backend use
 * All backend services should import this instead of creating their own client
 */
const supabase = createNodeClient();

module.exports = { createNodeClient, supabase };
