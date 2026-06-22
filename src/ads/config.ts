import { Platform } from 'react-native';

/**
 * Ads configuration shared by the native implementation and the web no-op stub.
 * This file imports no native ad code so it is safe to load on any platform.
 *
 * Real AdMob unit IDs go here once a Google Mobile Ads account is configured.
 * While empty, the native layer falls back to Google's test unit IDs so the
 * integration is exercisable without risking a live account (see ./ads).
 */
export const REAL_NATIVE_AD_UNIT_ID = 'ca-app-pub-6208140455870067/3981964845';
export const REAL_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-6208140455870067/1340057852';

/** Interstitials only run on real mobile platforms (not Expo Go web / SSR). */
export const adsSupportedPlatform = Platform.OS === 'android' || Platform.OS === 'ios';

/** Cap: at least this many qualifying actions must pass between interstitials. */
export const INTERSTITIAL_MIN_ACTIONS = 6;

/** Cap: and at least this much wall-clock time between interstitials. */
export const INTERSTITIAL_MIN_INTERVAL_MS = 4 * 60 * 1000;
