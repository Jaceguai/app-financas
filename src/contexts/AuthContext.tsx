import { Session, User } from '@supabase/supabase-js';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'User already registered': 'Este email já está cadastrado',
  'Signup requires a valid password': 'Senha inválida',
  'Password should be at least 6 characters': 'Senha deve ter no mínimo 6 caracteres',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
  'For security purposes, you can only request this once every 60 seconds': 'Aguarde 60 segundos para tentar novamente.',
  'Unable to validate email address: invalid format': 'Formato de email inválido',
  'New password should be different from the old password.': 'A nova senha deve ser diferente da anterior.',
};

export function translateAuthError(message: string): string {
  return ERROR_MAP[message] || message;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Servidor não respondeu. Tente novamente.')), 15000)
      );
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const { error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) return { error: translateAuthError(error.message) };
      return { error: null };
    } catch (err: any) {
      return { error: translateAuthError(err.message) || 'Erro ao conectar com o servidor' };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Servidor não respondeu. Tente novamente.')), 15000)
      );
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      const { error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

      if (error) return { error: translateAuthError(error.message) };
      return { error: null };
    } catch (err: any) {
      return { error: translateAuthError(err.message) || 'Erro ao criar conta' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: translateAuthError(error.message) };
      return { error: null };
    } catch (err: any) {
      return { error: translateAuthError(err.message) || 'Erro ao enviar email' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
