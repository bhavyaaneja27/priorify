import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInAsDemo: () => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    function finish(sessionUser: AuthUser | null) {
      if (settled) return;
      settled = true;
      setUser(sessionUser);
      setLoading(false);
    }

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      finish(null);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ? { id: session.user.id, email: session.user.email || '' } : null;
        if (!settled) {
          finish(u);
        } else {
          // Don't overwrite a demo user with null when Supabase fires
          setUser(prev => (prev?.isDemo ? prev : u));
        }
      });
      subscription = data.subscription;
    } catch {
      finish(null);
      return;
    }

    const fallback = setTimeout(() => finish(null), 800);

    return () => {
      clearTimeout(fallback);
      subscription?.unsubscribe();
    };
  }, []);

  const signInAsDemo = () => {
    setUser({ id: 'demo', email: 'demo@studyai.app', isDemo: true });
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      });
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  const signOut = async () => {
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (e) {
      return { error: e };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signInAsDemo, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
