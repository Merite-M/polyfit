import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export * from './database.types';

export declare function createNodeClient(
  supabaseUrl?: string,
  supabaseKey?: string
): SupabaseClient<Database> | null;
