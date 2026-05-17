import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your actual Supabase credentials
const supabaseUrl = 'https://pyhujdmsicwvgftodatk.supabase.co'
const supabaseAnonKey = 'sb_publishable_hxOe2nIDijiwtjGL0ndyrQ_TgNMk4FK'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export const REALTIME_CHANNELS = {
  LOCATIONS: 'locations',
  ORDERS: 'orders',
  INCIDENTS: 'incidents',
}
