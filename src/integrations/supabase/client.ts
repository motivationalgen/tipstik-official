// Supabase client wired to external project gohglzrecwdnvoeyxhth
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gohglzrecwdnvoeyxhth.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGdsenJlY3dkbnZvZXl4aHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjYyMDIsImV4cCI6MjA5MzIwMjIwMn0.boCIUOLFtC3SrsRmm_m-YqtiDKMAcNOBSkqkAYv2uqM";

// Import like: import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
