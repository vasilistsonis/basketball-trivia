import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hoopstrivia.app',
  appName: 'Hoops Trivia',
  webDir: 'dist',
  backgroundColor: '#F2EEE5',
  loggingBehavior: 'debug',
  ios: {
    // The web layout owns safe-area padding, including the question sheet.
    contentInset: 'never',
    backgroundColor: '#F2EEE5',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    zoomEnabled: true,
  },
  plugins: {
    StatusBar: {
      // Capacitor names this for the light background: status text is dark.
      style: 'LIGHT',
      overlaysWebView: true,
    },
  },
};

export default config;
