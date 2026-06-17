import { Platform } from 'react-native';

/**
 * IAP config shared by the native hook and the web no-op stub. Imports no
 * native purchase code, so it is safe to load on any platform.
 */

/**
 * Non-consumable product that removes ads ($2.99). This ID must match the
 * product configured in App Store Connect and Google Play Console.
 */
export const REMOVE_ADS_SKU = 'remove_ads';

/** Purchases only run on real mobile platforms (not web / SSR). */
export const iapSupportedPlatform = Platform.OS === 'android' || Platform.OS === 'ios';

export interface RemoveAdsState {
  /** True once the remove-ads entitlement is owned (mirrors purchaseState). */
  purchased: boolean;
  /** Localized store price (e.g. "$2.99"), or null until the product loads. */
  price: string | null;
  /** A purchase or restore is in flight. */
  busy: boolean;
  /** Whether the store connection is ready and a purchase can be attempted. */
  available: boolean;
  /** Launch the native purchase flow for the remove-ads product. */
  buy: () => Promise<void>;
  /** Restore a previously-owned remove-ads purchase. */
  restore: () => Promise<void>;
}
