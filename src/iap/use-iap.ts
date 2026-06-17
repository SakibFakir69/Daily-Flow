import { useCallback, useEffect, useState } from 'react';
import { useIAP } from 'expo-iap';

import { useSettings } from '@/settings/settings-context';

import { REMOVE_ADS_SKU, type RemoveAdsState } from './config';

/**
 * Wraps expo-iap's `useIAP` for the single "remove ads" non-consumable. Owns
 * the store connection, fetches the product (for its localized price), runs the
 * purchase/restore flows, and — on success — flips the persisted
 * `purchaseState` to `'purchased'`, which disables every ad surface app-wide
 * via `useAdsEnabled`. Re-checks entitlements on each launch so a reinstall or
 * a second device restores automatically.
 */
export function useRemoveAds(): RemoveAdsState {
  const { settings, update } = useSettings();
  const purchased = settings.purchaseState === 'purchased';
  const [busy, setBusy] = useState(false);

  const grant = useCallback(async () => {
    await update({ purchaseState: 'purchased' });
  }, [update]);

  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    getAvailablePurchases,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (purchase.productId === REMOVE_ADS_SKU) {
        try {
          // Non-consumable: finalize so the store stops re-delivering it.
          await finishTransaction({ purchase, isConsumable: false });
        } catch (error) {
          console.warn('[DailyFlow] finishTransaction failed:', error);
        }
        await grant();
      }
      setBusy(false);
    },
    onPurchaseError: (error) => {
      console.warn('[DailyFlow] Purchase error:', error);
      setBusy(false);
    },
    onError: (error) => {
      console.warn('[DailyFlow] IAP error:', error);
    },
  });

  // Once connected: load the product (for price) and re-check ownership.
  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [REMOVE_ADS_SKU], type: 'in-app' }).catch((error) =>
      console.warn('[DailyFlow] fetchProducts failed:', error)
    );
    getAvailablePurchases().catch((error) =>
      console.warn('[DailyFlow] getAvailablePurchases failed:', error)
    );
  }, [connected, fetchProducts, getAvailablePurchases]);

  // Grant whenever a restore (or launch re-check) surfaces the entitlement.
  useEffect(() => {
    if (purchased) return;
    if (availablePurchases.some((p) => p.productId === REMOVE_ADS_SKU)) {
      grant().catch((error) => console.warn('[DailyFlow] grant failed:', error));
    }
  }, [availablePurchases, purchased, grant]);

  const buy = useCallback(async () => {
    if (!connected || busy) return;
    setBusy(true);
    try {
      await requestPurchase({
        request: {
          apple: { sku: REMOVE_ADS_SKU },
          google: { skus: [REMOVE_ADS_SKU] },
        },
        type: 'in-app',
      });
      // Resolution arrives via onPurchaseSuccess / onPurchaseError.
    } catch (error) {
      console.warn('[DailyFlow] requestPurchase failed:', error);
      setBusy(false);
    }
  }, [connected, busy, requestPurchase]);

  const restore = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await getAvailablePurchases();
      // The effect above grants if the entitlement is present.
    } catch (error) {
      console.warn('[DailyFlow] restore failed:', error);
    } finally {
      setBusy(false);
    }
  }, [busy, getAvailablePurchases]);

  const product = products.find((p) => p.id === REMOVE_ADS_SKU);

  return {
    purchased,
    price: product?.displayPrice ?? null,
    busy,
    available: connected,
    buy,
    restore,
  };
}
