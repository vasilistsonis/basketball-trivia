import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hoopstrivia.app',
  appName: 'Hoops Trivia',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
