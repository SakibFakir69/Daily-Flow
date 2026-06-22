import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True when the app is running inside the Expo Go sandbox.
 *
 * Expo Go ships a fixed native binary and cannot load custom native modules
 * (AdMob, the widget host, etc.) or the remote-notification pieces of
 * expo-notifications. Features that depend on those must no-op here and are
 * only exercisable in a development/production build. See AGENTS.md.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
