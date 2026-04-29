import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checkpoint.student',
  appName: 'Checkpoint Student',
  webDir: 'build',
  server: {
    cleartext: true,
    androidScheme: 'https'
  },
  ios: {
    allowsLinkPreview: false
  }
};

export default config;
