import { type RemoveAdsState } from './config';

/**
 * Web (and any non-native) stub. There are no in-app purchases off-device and
 * no ads to remove, so the remove-ads UI is hidden on web (see settings) and
 * this hook stays inert. Metro picks this over ./use-iap.ts when bundling web.
 */
export function useRemoveAds(): RemoveAdsState {
  return {
    purchased: false,
    price: null,
    busy: false,
    available: false,
    buy: async () => {},
    restore: async () => {},
  };
}
