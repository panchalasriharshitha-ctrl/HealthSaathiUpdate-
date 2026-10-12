// HealthSaathi AI - Supabase Client & Authentication Service
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL !== 'https://your-project.supabase.co'
);

let supabaseInstance = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err.message);
  }
}

// Fallback local session storage key for Demo/Guest mode
const LOCAL_USER_KEY = 'healthsaathi_demo_user';

export const supabase = supabaseInstance || {
  auth: {
    async getSession() {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) {
        try {
          const user = JSON.parse(stored);
          return { data: { session: { user } }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },

    async signInWithPassword({ email, password }) {
      if (!email || !password) {
        return { data: null, error: { message: 'Please provide both email and password' } };
      }
      const user = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { name: email.split('@')[0] },
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      return { data: { user, session: { user } }, error: null };
    },

    async signUp({ email, password, options }) {
      if (!email || !password) {
        return { data: null, error: { message: 'Please provide both email and password' } };
      }
      const user = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: options?.data || { name: email.split('@')[0] },
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      return { data: { user, session: { user } }, error: null };
    },

    async signOut() {
      localStorage.removeItem(LOCAL_USER_KEY);
      return { error: null };
    },

    onAuthStateChange(callback) {
      // Local broadcast trigger
      const handler = () => {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        const user = stored ? JSON.parse(stored) : null;
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
      };
      window.addEventListener('storage', handler);
      return {
        data: {
          subscription: {
            unsubscribe: () => window.removeEventListener('storage', handler),
          },
        },
      };
    },
  },
};
