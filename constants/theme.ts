// constants/theme.ts
import { Platform } from 'react-native';

const tintColorLight = '#2563EB';
const tintColorDark = '#38BDF8';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
  },
};

export const THEME = {
  primary: '#2563EB',         // Electric Cobalt
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryGlow: 'rgba(37, 99, 235, 0.25)',
  accent: '#06B6D4',          // Electric Cyan
  canvas: '#F8FAFC',          // App Background Canvas
  card: '#FFFFFF',            // Surface Card
  cardElevated: '#FFFFFF',
  cardSubtle: '#F1F5F9',
  border: '#E2E8F0',          // Subtle outline
  borderLight: '#F1F5F9',
  text: '#0F172A',            // Slate 900
  sub: '#64748B',             // Slate 500
  muted: '#94A3B8',           // Slate 400
  success: '#10B981',         // Emerald
  successLight: '#ECFDF5',
  warning: '#F59E0B',         // Amber
  warningLight: '#FFFBEB',
  danger: '#EF4444',          // Rose Red
  dangerLight: '#FEF2F2',
  overlay: 'rgba(15, 23, 42, 0.45)',
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 3,
    },
    float: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 20,
      elevation: 6,
    },
    glow: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
  },
};

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  food: '#EF4444',            // Red
  groceries: '#10B981',       // Green
  transportation: '#F59E0B',  // Amber
  electricity: '#06B6D4',     // Cyan
  water: '#0284C7',           // Sky Blue
  internet: '#6366F1',        // Indigo
  rent: '#8B5CF6',            // Purple
  entertainment: '#EC4899',   // Pink
  shopping: '#F97316',        // Orange
  health: '#14B8A6',          // Teal
  education: '#3B82F6',       // Blue
  subscriptions: '#64748B',   // Slate
  others: '#94A3B8',          // Gray
};

export const CATEGORY_ICON_MAP: Record<string, string> = {
  food: 'fast-food',
  groceries: 'cart',
  transportation: 'car',
  electricity: 'flash',
  water: 'water',
  internet: 'wifi',
  rent: 'home',
  entertainment: 'game-controller',
  shopping: 'bag-handle',
  health: 'medkit',
  education: 'school',
  subscriptions: 'repeat',
  others: 'ellipsis-horizontal-circle',
};

export function getCategoryColor(category?: string): string {
  if (!category) return '#94A3B8';
  const key = category.trim().toLowerCase();
  return CATEGORY_COLOR_MAP[key] || '#94A3B8';
}

export function getCategoryTint(category?: string): string {
  const color = getCategoryColor(category);
  return `${color}18`; // ~10% opacity tint
}

export function getCategoryIcon(category?: string): string {
  if (!category) return 'ellipsis-horizontal-circle';
  const key = category.trim().toLowerCase();
  return CATEGORY_ICON_MAP[key] || 'pricetag';
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
