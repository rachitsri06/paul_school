import { createClient } from '@supabase/supabase-js';

// Hardcoding for a "Proof of Life" test to bypass Vercel config issues
const supabaseUrl = 'https://ucdwxcrcjdmtipubxovz.supabase.co';
const supabaseKey = 'sb_publishable_Erx_nWJswUsMn8_toSrhrQ_40b1-9xr';

// Note: Using the Anon Key here for the client-side initialization 
// to ensure the login page can actually load.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});
