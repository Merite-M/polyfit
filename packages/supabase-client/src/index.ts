/**
 * PolyFit Supabase Client Package
 * 
 * This is the SINGLE SOURCE OF TRUTH for all Supabase client initialization
 * across the PolyFit monorepo. No app should create its own Supabase client.
 * 
 * Usage:
 * - Backend (Node.js): import { supabase } from '@polyfit/supabase-client'
 * - Web (Browser): import { supabase } from '@polyfit/supabase-client'
 * - Mobile (React Native): import { supabase } from '@polyfit/supabase-client'
 */

// Re-export browser client (used by web apps)
export { supabase } from './browser';
export type { Database } from './database.types';

// Node.js export for build time resolution
// Backend apps will use the CommonJS build from node.js
