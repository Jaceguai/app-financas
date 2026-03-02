import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl as string;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey as string;

// Debug: Verificar se as variáveis estão carregadas
console.log('🔧 Supabase Config Check:');
console.log('URL exists:', !!SUPABASE_URL);
console.log('Key exists:', !!SUPABASE_ANON_KEY);
if (SUPABASE_URL) {
  console.log('URL:', SUPABASE_URL);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERRO: Variáveis do Supabase não configuradas!');
  console.error('Verifique o arquivo .env');
}

// Teste de conectividade básico
if (SUPABASE_URL) {
  fetch(SUPABASE_URL, { method: 'HEAD' })
    .then(() => console.log('✅ Supabase acessível'))
    .catch((err) => {
      console.error('❌ Não foi possível conectar ao Supabase:', err.message);
      console.error('Verifique:');
      console.error('1. Internet do dispositivo/emulador');
      console.error('2. URL do Supabase no .env');
      console.error('3. Firewall/proxy');
    });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
