/**
 * Supabase Client Configuration
 * Handles connection to Supabase backend
 * 
 * @throws {Error} If required environment variables are missing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars: string[] = []
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  throw new Error(
    `❌ Supabase configuration error: Missing required environment variables.\n` +
    `Missing: ${missingVars.join(', ')}\n` +
    `Please add these to your .env.local file.\n` +
    `Get your credentials from: https://app.supabase.com -> Your Project -> Settings -> API`
  )
}

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(
    `❌ Invalid NEXT_PUBLIC_SUPABASE_URL format.\n` +
    `Expected format: https://your-project.supabase.co\n` +
    `Received: ${supabaseUrl}`
  )
}

/**
 * Supabase client instance
 * Use this for all database operations
 * 
 * @example
 * ```ts
 * const { data, error } = await supabase.from('events').select('*')
 * ```
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'eventcoder@1.0.0',
    },
  },
})

/**
 * Check if Supabase is configured
 * @returns {boolean} True if both URL and key are present
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

/**
 * Get Supabase configuration status (for debugging)
 */
export function getSupabaseConfig() {
  return {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET',
    hasKey: !!supabaseAnonKey,
    isConfigured: isSupabaseConfigured(),
  }
}

