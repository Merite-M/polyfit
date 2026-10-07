/**
 * Legacy service wrapper - DEPRECATED
 * 
 * This file is deprecated. All services should import supabase directly from @polyfit/supabase-client.
 * This file remains for backward compatibility during migration.
 * 
 * Usage:
 * OLD: const { supabase } = require('../services/supabaseService');
 * NEW: const { supabase } = require('@polyfit/supabase-client');
 */

const { supabase } = require('@polyfit/supabase-client');

module.exports = { supabase };
