import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { TranslationKey } from '@/i18n/translations';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * One screen of the first-run motion overview. `icon` is the glyph shown in the
 * animated accent circle; `tint` overrides the slide's accent color (defaults to
 * the app coral) so the walkthrough feels like a little guided tour.
 */
export interface OnboardingSlide {
  key: string;
  icon: IoniconName;
  /** Accent hex for this slide's circle/glow. Undefined = theme tint. */
  tint?: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: 'welcome',
    icon: 'sparkles',
    titleKey: 'onboarding.welcome.title',
    bodyKey: 'onboarding.welcome.body',
  },
  {
    key: 'capture',
    icon: 'flash',
    tint: '#F5A623',
    titleKey: 'onboarding.capture.title',
    bodyKey: 'onboarding.capture.body',
  },
  {
    key: 'organize',
    icon: 'albums',
    tint: '#3C87F7',
    titleKey: 'onboarding.organize.title',
    bodyKey: 'onboarding.organize.body',
  },
  {
    key: 'habits',
    icon: 'flame',
    tint: '#FF6B4A',
    titleKey: 'onboarding.habits.title',
    bodyKey: 'onboarding.habits.body',
  },
  {
    key: 'private',
    icon: 'lock-closed',
    tint: '#34C759',
    titleKey: 'onboarding.private.title',
    bodyKey: 'onboarding.private.body',
  },
];
