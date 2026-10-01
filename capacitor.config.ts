import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hoopstrivia.app',
  appName: 'Hoops Trivia',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    // Paper, so there's no white flash between the launch screen and the first paint.
    backgroundColor: '#F2EEE5',
  },
};

export default config;
