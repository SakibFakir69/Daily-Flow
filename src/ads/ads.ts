import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  TestIds,
  type InterstitialAd as InterstitialAdType,
} from 'react-native-google-mobile-ads';

import {
  INTERSTITIAL_MIN_ACTIONS,
  INTERSTITIAL_MIN_INTERVAL_MS,
  REAL_INTERSTITIAL_AD_UNIT_ID,
  REAL_NATIVE_AD_UNIT_ID,
  adsSupportedPlatform,
} from './config';

/** Use the real unit ID in production once set; test IDs otherwise. */
export const NATIVE_AD_UNIT_ID =
  !__DEV__ && REAL_NATIVE_AD_UNIT_ID ? REAL_NATIVE_AD_UNIT_ID : TestIds.NATIVE;
export const INTERSTITIAL_AD_UNIT_ID =
  !__DEV__ && REAL_INTERSTITIAL_AD_UNIT_ID ? REAL_INTERSTITIAL_AD_UNIT_ID : TestIds.INTERSTITIAL;

let initialized = false;
let interstitial: InterstitialAdType | null = null;
let interstitialLoaded = false;
let actionsSinceLastShow = 0;
let lastShownAt = 0;

function createInterstitial() {
  const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);
  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    // Preload the next one so it's ready by the time the cap allows another.
    interstitialLoaded = false;
    ad.load();
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });
  interstitial = ad;
  ad.load();
}

/**
 * Initializes the Mobile Ads SDK once and preloads the first interstitial.
 * Idempotent and a no-op on unsupported platforms. Callers should only invoke
 * this when ads are enabled (free tier) — purchased users never init the SDK.
 */
export async function initializeAds(): Promise<void> {
  if (initialized || !adsSupportedPlatform) return;
  initialized = true;
  try {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
    });
    await mobileAds().initialize();
    createInterstitial();
  } catch (error) {
    console.warn('[DailyFlow] Ads initialization failed:', error);
  }
}

/**
 * Records a qualifying user action and shows an interstitial only if every cap
 * is satisfied: ads enabled, enough actions since the last one, enough wall
 * time elapsed, and an ad is preloaded. Silently does nothing otherwise.
 */
export function maybeShowInterstitial(enabled: boolean): void {
  if (!enabled || !adsSupportedPlatform) return;

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
