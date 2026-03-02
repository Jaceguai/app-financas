import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Finanças Pro',
  slug: 'financas-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icons/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/icons/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#fcfffe',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.jaceguai.financasapp',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icons/adaptive-icon.png',
      backgroundImage: './assets/icons/adaptive-icon-background.png',
    },
    edgeToEdgeEnabled: true,
    package: 'com.jaceguai.financasapp',
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'ACCESS_WIFI_STATE',
    ],
  },
  web: {
    favicon: './assets/icons/favicon.png',
  },
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    eas: {
      projectId: 'ec8a28cf-77bf-4f4c-8139-9eda185a6018',
    },
  },
});
