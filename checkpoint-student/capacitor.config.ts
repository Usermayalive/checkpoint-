import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checkpoint.student',
  appName: 'Checkpoint Student',
  webDir: 'build',
  server: {
    // Allow plain HTTP requests to local backend
    cleartext: true,
    androidScheme: 'https'
  },
  ios: {
    // Allow HTTP connections on iOS (App Transport Security)
    allowsLinkPreview: false
  }
};

export default config;
