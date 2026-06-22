import { useCallback } from 'react';

import { useSettings } from '@/settings/settings-context';
import { translate, type TranslationKey } from './translations';

/**
 * Returns a `t(key)` function bound to the current language from settings.
 * Re-renders when the language changes (settings context updates).
 */
export function useTranslation() {
  
  const { settings } = useSettings();
  const language = settings.language;

  const t = useCallback((key: TranslationKey) => translate(language, key), [language]);

  return { t, language };
}
