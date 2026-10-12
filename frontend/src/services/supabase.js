// HealthSaathi - Supabase Client & Authentication Service
import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables, with optional local override for testing
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const LOCAL_OVERRIDE_URL = typeof window !== 'undefined' ? localStorage.getItem('healthsaathi_supabase_url') || localStorage.getItem('medimate_supabase_url') || '' : '';
const LOCAL_OVERRIDE_KEY = typeof window !== 'undefined' ? localStorage.getItem('healthsaathi_supabase_anon_key') || localStorage.getItem('medimate_supabase_anon_key') || '' : '';

export const SUPABASE_URL = (ENV_SUPABASE_URL || LOCAL_OVERRIDE_URL).trim();
export const SUPABASE_ANON_KEY = (ENV_SUPABASE_ANON_KEY || LOCAL_OVERRIDE_KEY).trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project.supabase.co') &&
  !SUPABASE_ANON_KEY.includes('your_supabase_anon')
);

if (typeof window !== 'undefined') {
  if (!ENV_SUPABASE_URL) {
    console.warn('⚠️ [HealthSaathi Supabase] VITE_SUPABASE_URL is undefined or empty in frontend/.env');
  }
  if (!ENV_SUPABASE_ANON_KEY) {
    console.warn('⚠️ [HealthSaathi Supabase] VITE_SUPABASE_ANON_KEY is undefined or empty in frontend/.env');
  }
}

let supabaseClient = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    if (typeof window !== 'undefined') {
      console.info('[HealthSaathi Supabase Client] Initialized singleton:', {
        url: SUPABASE_URL,
        hasAnonKey: Boolean(SUPABASE_ANON_KEY),
        keyLength: SUPABASE_ANON_KEY?.length || 0,
      });
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
} else if (typeof window !== 'undefined') {
  console.warn('[HealthSaathi Supabase Client] Missing or invalid credentials in frontend/.env');
}

/**
 * Diagnostic helper to ping Supabase Auth service
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase credentials missing in frontend/.env' };
  }
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, error: error.message, status: error.status };
    }
    return { ok: true, endpoint: SUPABASE_URL };
  } catch (err) {
    return { ok: false, error: err.message, status: err?.status };
  }
}

// Fallback error wrapper if Supabase credentials are missing
export const supabase = supabaseClient || {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    async signUp() {
      return { 
        data: null, 
        error: new Error('Supabase is not configured yet. Please provide your Supabase URL and Anon Key in frontend/.env.') 
      };
    },
    async signInWithPassword() {
      return { 
        data: null, 
        error: new Error('Supabase is not configured yet. Please provide your Supabase URL and Anon Key in frontend/.env.') 
      };
    },
    async verifyOtp() {
      return { 
        data: null, 
        error: new Error('Supabase is not configured yet. Please provide your Supabase URL and Anon Key in frontend/.env.') 
      };
    },
    async resend() {
      return { 
        data: null, 
        error: new Error('Supabase is not configured yet. Please provide your Supabase URL and Anon Key in frontend/.env.') 
      };
    },
    async resetPasswordForEmail() {
      return { 
        data: null, 
        error: new Error('Supabase is not configured yet. Please provide your Supabase URL and Anon Key in frontend/.env.') 
      };
    },
    async updateUser() {
      return { 
        data: null, 
        error: new Error('Supabase is not configured yet. Please provide your Supabase URL and Anon Key in frontend/.env.') 
      };
    },
    async signOut() {
      return { error: null };
    },
    onAuthStateChange() {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },
};

/**
 * Configure or update local Supabase credentials (runtime helper)
 */
export function setRuntimeSupabaseConfig(url, anonKey) {
  if (url && anonKey) {
    localStorage.setItem('healthsaathi_supabase_url', url.trim());
    localStorage.setItem('healthsaathi_supabase_anon_key', anonKey.trim());
    localStorage.removeItem('medimate_supabase_url');
    localStorage.removeItem('medimate_supabase_anon_key');
    window.location.reload();
  }
}

export function clearRuntimeSupabaseConfig() {
  localStorage.removeItem('healthsaathi_supabase_url');
  localStorage.removeItem('healthsaathi_supabase_anon_key');
  localStorage.removeItem('medimate_supabase_url');
  localStorage.removeItem('medimate_supabase_anon_key');
  window.location.reload();
}
