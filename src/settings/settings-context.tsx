import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { settingsRepo, type Settings } from '@/db';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  purchaseState: 'free',
  lastBackupAt: null,
  quietHoursStart: null,
  quietHoursEnd: null,
};

interface SettingsContextValue {
  settings: Settings;
  /** Patch one or more settings; persists to the DB and updates context. */
  update: (patch: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Loads the single settings row into context and persists edits. Mounted under
 * the DB-ready gate so it can read immediately; defaults render until the row
 * loads (a frame later) to avoid a flash of empty state.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    settingsRepo
      .getSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch((error) => console.error('[DailyFlow] Failed to load settings:', error));
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    // Optimistic: reflect immediately, then persist.
    setSettings((prev) => ({ ...prev, ...patch }));
    try {
      await settingsRepo.updateSettings(patch);
    } catch (error) {
      console.error('[DailyFlow] Failed to save settings:', error);
    }
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/** Returns settings + updater. Falls back to defaults if used outside the provider. */
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return { settings: DEFAULT_SETTINGS, update: async () => {} };
  }
  return ctx;
}
