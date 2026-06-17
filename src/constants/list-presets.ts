import Ionicons from '@expo/vector-icons/Ionicons';

/** Preset palette for user lists (avoids a full color wheel — fast, tasteful picks). */
export const LIST_COLORS = [
  '#FF6B4A',
  '#F5A623',
  '#34C759',
  '#30B0C7',
  '#0A84FF',
  '#5E5CE6',
  '#AF52DE',
  '#FF2D55',
] as const;

/** Preset icon choices (Ionicons names). */
export const LIST_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'list',
  'home',
  'briefcase',
  'cart',
  'heart',
  'barbell',
  'book',
  'school',
  'airplane',
  'restaurant',
  'wallet',
  'sparkles',
];

export const DEFAULT_LIST_COLOR = LIST_COLORS[0];
export const DEFAULT_LIST_ICON: keyof typeof Ionicons.glyphMap = 'list';
