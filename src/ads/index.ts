// Metro resolves ./ads and ./ad-card to their .web variants on web automatically.
export {
  INTERSTITIAL_AD_UNIT_ID,
  NATIVE_AD_UNIT_ID,
  initializeAds,
  maybeShowInterstitial,
} from './ads';
export { AdCard } from './ad-card';
export { useAdsEnabled } from './use-ads-enabled';
