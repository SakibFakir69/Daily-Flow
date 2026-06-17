import { useSettings } from '@/settings/settings-context';

import { adsSupportedPlatform } from './config';

/**
 * Whether ads should be shown: only on supported native platforms and only for
 * the free tier. Purchasing "remove ads" flips `purchaseState` to `purchased`
 * (see Milestone 11), which disables every ad surface app-wide.
 */
export function useAdsEnabled(): boolean {
  const { settings } = useSettings();
  return adsSupportedPlatform && settings.purchaseState === 'free';
}
