import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iapSupportedPlatform, useRemoveAds } from '@/iap';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { settingsRepo, type LanguagePreference, type ThemePreference } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { exportBackup, importBackup } from '@/lib/backup';
import { resyncAllReminders } from '@/notifications';
import { useSettings } from '@/settings/settings-context';
import { refreshTodayWidget } from '@/widgets';

const backupSupported = Platform.OS !== 'web';

const THEME_OPTIONS: { value: ThemePreference; labelKey: 'settings.theme.system' | 'settings.theme.light' | 'settings.theme.dark' }[] = [
  { value: 'system', labelKey: 'settings.theme.system' },
  { value: 'light', labelKey: 'settings.theme.light' },
  { value: 'dark', labelKey: 'settings.theme.dark' },
];

const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const removeAds = useRemoveAds();

  const buyLabel =
    removeAds.price !== null
      ? `${t('settings.removeads.buy')} · ${removeAds.price}`
      : t('settings.removeads.buy');

  const [dataBusy, setDataBusy] = useState(false);

  const lastBackupLabel =
    settings.lastBackupAt !== null
      ? `${t('settings.backup.last')}: ${new Date(settings.lastBackupAt).toLocaleDateString()}`
      : t('settings.backup.never');

  const handleExport = async () => {
    if (dataBusy) return;
    setDataBusy(true);
    const result = await exportBackup();
    setDataBusy(false);
    if (!result.ok && result.reason === 'error') {
      Alert.alert(t('settings.backup.error.title'), t('settings.backup.error.message'));
    }
  };

  const runImport = async () => {
    setDataBusy(true);
    const result = await importBackup();
    if (result.ok) {
      // Reload state that won't refetch on its own, then resync reminders.
      const reloaded = await settingsRepo.getSettings();
      await update(reloaded);
      await resyncAllReminders();
      await refreshTodayWidget();
    }
    setDataBusy(false);

    if (result.ok) {
      Alert.alert(t('settings.restore.done.title'), t('settings.restore.done.message'));
    } else if (result.reason === 'invalid') {
      Alert.alert(t('settings.restore.error.title'), t('settings.restore.error.invalid'));
    } else if (result.reason === 'error') {
      Alert.alert(t('settings.restore.error.title'), t('settings.backup.error.message'));
    }
  };

  const handleImport = () => {
    if (dataBusy) return;
    Alert.alert(t('settings.restore.confirm.title'), t('settings.restore.confirm.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.restore'),
        style: 'destructive',
        onPress: () => {
          runImport().catch((error) => console.error('[DailyFlow] import handler:', error));
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('common.done')}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <ScreenHeader title={t('settings.title')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          {t('settings.appearance')}
        </ThemedText>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="default" style={styles.rowLabel}>
            {t('settings.theme')}
          </ThemedText>
          <View style={styles.segment}>
            {THEME_OPTIONS.map((opt) => {
              const active = settings.theme === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => update({ theme: opt.value })}
                  style={[
                    styles.segmentItem,
                    { backgroundColor: active ? theme.tint : theme.backgroundElement },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.background : theme.text }}>
                    {t(opt.labelKey)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="default" style={styles.rowLabel}>
            {t('settings.language')}
          </ThemedText>
          <View style={styles.segment}>
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = settings.language === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => update({ language: opt.value })}
                  style={[
                    styles.segmentItem,
                    { backgroundColor: active ? theme.tint : theme.backgroundElement },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.background : theme.text }}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          {t('settings.general')}
        </ThemedText>

        <Pressable
          onPress={() => {
            update({ onboardingCompletedAt: null });
            router.back();
          }}
          style={[styles.card, styles.introRow, { backgroundColor: theme.card, borderColor: theme.border }]}
          accessibilityRole="button"
          accessibilityLabel={t('settings.intro.replay')}>
          <Ionicons name="play-circle-outline" size={22} color={theme.tint} />
          <View style={styles.introText}>
            <ThemedText type="default" style={styles.rowLabel}>
              {t('settings.intro.replay')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('settings.intro.replay.subtitle')}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </Pressable>

        {iapSupportedPlatform ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              {t('settings.purchases')}
            </ThemedText>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.removeAdsHeader}>
                <Ionicons
                  name={removeAds.purchased ? 'checkmark-circle' : 'remove-circle-outline'}
                  size={22}
                  color={removeAds.purchased ? theme.tint : theme.text}
                />
                <ThemedText type="default" style={styles.rowLabel}>
                  {t('settings.removeads')}
                </ThemedText>
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                {removeAds.purchased
                  ? t('settings.removeads.purchased')
                  : t('settings.removeads.subtitle')}
              </ThemedText>

              {removeAds.purchased ? null : (
                <>
                  <Pressable
                    onPress={removeAds.buy}
                    disabled={removeAds.busy || !removeAds.available}
                    style={[
                      styles.buyButton,
                      {
                        backgroundColor: theme.tint,
                        opacity: removeAds.busy || !removeAds.available ? 0.5 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: removeAds.busy || !removeAds.available }}>
                    {removeAds.busy ? (
                      <ActivityIndicator color={theme.background} />
                    ) : (
                      <ThemedText type="default" style={{ color: theme.background, fontWeight: '600' }}>
                        {buyLabel}
                      </ThemedText>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={removeAds.restore}
                    disabled={removeAds.busy}
                    hitSlop={8}
                    style={styles.restoreButton}
                    accessibilityRole="button">
                    <ThemedText type="small" style={{ color: theme.tint }}>
                      {t('settings.removeads.restore')}
                    </ThemedText>
                  </Pressable>

                  {removeAds.available ? null : (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('settings.removeads.unavailable')}
                    </ThemedText>
                  )}
                </>
              )}
            </View>
          </>
        ) : null}

        {backupSupported ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              {t('settings.data')}
            </ThemedText>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {lastBackupLabel}
              </ThemedText>

              <View style={styles.dataButtons}>
                <Pressable
                  onPress={handleExport}
                  disabled={dataBusy}
                  style={[styles.dataButton, { backgroundColor: theme.tint, opacity: dataBusy ? 0.5 : 1 }]}
                  accessibilityRole="button">
                  <Ionicons name="share-outline" size={18} color={theme.background} />
                  <ThemedText type="small" style={{ color: theme.background, fontWeight: '600' }}>
                    {t('settings.backup')}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleImport}
                  disabled={dataBusy}
                  style={[
                    styles.dataButton,
                    styles.dataButtonOutline,
                    { borderColor: theme.tint, opacity: dataBusy ? 0.5 : 1 },
                  ]}
                  accessibilityRole="button">
                  <Ionicons name="download-outline" size={18} color={theme.tint} />
                  <ThemedText type="small" style={{ color: theme.tint, fontWeight: '600' }}>
                    {t('settings.restore')}
                  </ThemedText>
                </Pressable>
              </View>

              {dataBusy ? <ActivityIndicator color={theme.tint} /> : null}
            </View>
          </>
        ) : null}
        {/* PAID */}
        {__DEV__ && (
          <Pressable
            onPress={() =>
              update({ purchaseState: settings.purchaseState === 'free' ? 'purchased' : 'free' })
            }
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">
              DEV: purchaseState = {settings.purchaseState} (tap to toggle)
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          onPress={() => Linking.openURL('https://www.linkedin.com/company/seven-venture-labs/')}
          style={styles.builtBy}
          accessibilityRole="link">
          <ThemedText type="small" themeColor="textSecondary">
            Built by Seven Venture Labs
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.one,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  rowLabel: {
    fontWeight: '600',
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  introText: {
    flex: 1,
    gap: Spacing.half,
  },
  removeAdsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  buyButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
  },
  dataButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dataButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
  dataButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  builtBy: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});