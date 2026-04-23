import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chekkiai.app',
  appName: 'Chekki AI',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      iosClientId: '123535525914-gonom4ucs3h2pkl3gtn2atjvc4pgpep0.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: true,
    minWebViewVersion: 60,
  },
};

export default config;
