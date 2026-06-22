// Type-only import: erased at compile time, so it never touches the native
// binary. The runtime module is loaded lazily via loadAdsModule() below.
import type { InterstitialAd } from 'react-native-google-mobile-ads';

import {
  INTERSTITIAL_MIN_ACTIONS,
  INTERSTITIAL_MIN_INTERVAL_MS,
  REAL_INTERSTITIAL_AD_UNIT_ID,
  REAL_NATIVE_AD_UNIT_ID,
  adsSupportedPlatform,
} from './config';

type AdsModule = typeof import('react-native-google-mobile-ads');

let cachedModule: AdsModule | null | undefined;

/**
 * Lazily loads the native Google Mobile Ads module, or returns null when its
 * native binary isn't present — Expo Go, web, or any build where the module
 * wasn't linked. The require() is wrapped because the package calls
 * `TurboModuleRegistry.getEnforcing('RNGoogleMobileAdsModule')` at import time,
 * which throws synchronously when the module is unregistered. Importing it at
 * the top of the file (as before) therefore crashed the whole app in Expo Go;
 * deferring it behind this guard lets every ad surface degrade to a no-op.
 *
 * The result is cached so the require()/throw happens at most once.
 */
export function loadAdsModule(): AdsModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (!adsSupportedPlatform) {
    cachedModule = null;
    return cachedModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('react-native-google-mobile-ads') as AdsModule;
  } catch (error) {
    console.warn('[DailyFlow] Google Mobile Ads native module unavailable:', error);
    cachedModule = null;
  }
  return cachedModule;
}

/** Whether native ads can actually run in this binary (false in Expo Go / web). */
export function adsAvailable(): boolean {
  return loadAdsModule() !== null;
}

/**
 * Resolves the native (banner) ad unit ID, preferring the real ID in production.
 * Returns null when the ads module is unavailable so callers render nothing.
 */
export function getNativeAdUnitId(): string | null {
  const ads = loadAdsModule();
  if (!ads) return null;
  return !__DEV__ && REAL_NATIVE_AD_UNIT_ID ? REAL_NATIVE_AD_UNIT_ID : ads.TestIds.NATIVE;
}

function getInterstitialAdUnitId(ads: AdsModule): string {
  return !__DEV__ && REAL_INTERSTITIAL_AD_UNIT_ID
    ? REAL_INTERSTITIAL_AD_UNIT_ID
    : ads.TestIds.INTERSTITIAL;
}

let initialized = false;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let actionsSinceLastShow = 0;
let lastShownAt = 0;

function createInterstitial(ads: AdsModule) {
  const ad = ads.InterstitialAd.createForAdRequest(getInterstitialAdUnitId(ads));
  ad.addAdEventListener(ads.AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  ad.addAdEventListener(ads.AdEventType.CLOSED, () => {
    // Preload the next one so it's ready by the time the cap allows another.
    interstitialLoaded = false;
    ad.load();
  });
  ad.addAdEventListener(ads.AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });
  interstitial = ad;
  ad.load();
}

/**
 * Initializes the Mobile Ads SDK once and preloads the first interstitial.
 * Idempotent and a no-op when the ads module is unavailable (Expo Go / web) or
 * on unsupported platforms. Callers should only invoke this when ads are enabled
 * (free tier) — purchased users never init the SDK.
 */
export async function initializeAds(): Promise<void> {
  if (initialized) return;
  const ads = loadAdsModule();
  if (!ads) return;
  initialized = true;
  try {
    await ads.default().setRequestConfiguration({
      maxAdContentRating: ads.MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
    });
    await ads.default().initialize();
    createInterstitial(ads);
  } catch (error) {
    console.warn('[DailyFlow] Ads initialization failed:', error);
  }
}

/**
 * Records a qualifying user action and shows an interstitial only if every cap
 * is satisfied: ads enabled, enough actions since the last one, enough wall
 * time elapsed, and an ad is preloaded. Silently does nothing otherwise — which
 * includes the case where the ads module never loaded (Expo Go / web), since
 * `interstitial` then stays null.
 */
export function maybeShowInterstitial(enabled: boolean): void {
  if (!enabled) return;

  actionsSinceLastShow += 1;
  if (actionsSinceLastShow < INTERSTITIAL_MIN_ACTIONS) return;
  if (Date.now() - lastShownAt < INTERSTITIAL_MIN_INTERVAL_MS) return;
  if (!interstitial || !interstitialLoaded) return;

  actionsSinceLastShow = 0;
  lastShownAt = Date.now();
  interstitial.show().catch((error) => {
    console.warn('[DailyFlow] Interstitial show failed:', error);
  });
}
