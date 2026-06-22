import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
// Type-only: erased at compile time so it never loads the native binary.
import type { NativeAd } from 'react-native-google-mobile-ads';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { getNativeAdUnitId, loadAdsModule } from './ads';

/**
 * A Native Advanced ad rendered as a card that matches DailyFlow's task rows.
 * Renders nothing until an ad loads (and nothing if loading fails), so it never
 * leaves an empty placeholder. The caller is responsible for gating on whether
 * ads are enabled (free tier); this only handles loading + presentation.
 */
export function AdCard() {
  const colors = useTheme();
  // Loaded lazily; null in Expo Go / web where the native binary is absent.
  const ads = loadAdsModule();
  const adUnitId = getNativeAdUnitId();
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    if (!ads || !adUnitId) return;
    let active = true;
    let loadedAd: NativeAd | null = null;

    ads.NativeAd.createForAdRequest(adUnitId)
      .then((next) => {
        if (!active) {
          next.destroy();
          return;
        }
        loadedAd = next;
        setAd(next);
      })
      .catch((error) => console.warn('[DailyFlow] Native ad load failed:', error));

    return () => {
      active = false;
      loadedAd?.destroy();
    };
  }, [ads, adUnitId]);

  if (!ads || !ad) return null;

  const { NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } = ads;

  return (
    <NativeAdView
      nativeAd={ad}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        {ad.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: ad.icon.url }} style={styles.icon} />
          </NativeAsset>
        ) : null}
        <View style={styles.headerText}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={[styles.headline, { color: colors.text }]} numberOfLines={1}>
              {ad.headline}
            </Text>
          </NativeAsset>
          <Text style={[styles.sponsored, { color: colors.textSecondary }]}>Sponsored</Text>
        </View>
      </View>

      {ad.body ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
            {ad.body}
          </Text>
        </NativeAsset>
      ) : null}

      {ad.mediaContent?.hasVideoContent || (ad.images?.length ?? 0) > 0 ? (
        <NativeMediaView style={styles.media} resizeMode="cover" />
      ) : null}

      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text style={[styles.cta, { backgroundColor: colors.tint }]}>{ad.callToAction}</Text>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
  },
  headerText: {
    flex: 1,
  },
  headline: {
    fontSize: 15,
    fontWeight: '600',
  },
  sponsored: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  media: {
    width: '100%',
    height: 140,
    borderRadius: Radius.md,
  },
  cta: {
    alignSelf: 'flex-start',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
});
