import type { AccentPreset, Theme } from './theme';

export type RgbHexColor = `#${string}`;
export type RgbaColor = `rgba(${string})`;

export type AccentPalette = {
  solid: RgbHexColor;
  strong: RgbHexColor;
  soft: RgbaColor;
  ring: RgbaColor;
  textOnAccent: RgbHexColor;
};

export const ACCENT_PALETTES: Record<AccentPreset, AccentPalette> = {
  gold: {
    solid: '#FAB95B',
    strong: '#E9A543',
    soft: 'rgba(250, 185, 91, 0.18)',
    ring: 'rgba(233, 165, 67, 0.35)',
    textOnAccent: '#111111',
  },
  green: {
    solid: '#34C759',
    strong: '#28B24A',
    soft: 'rgba(52, 199, 89, 0.2)',
    ring: 'rgba(40, 178, 74, 0.35)',
    textOnAccent: '#111111',
  },
  blue: {
    solid: '#3B82F6',
    strong: '#2563EB',
    soft: 'rgba(59, 130, 246, 0.2)',
    ring: 'rgba(37, 99, 235, 0.38)',
    textOnAccent: '#111111',
  },
  pink: {
    solid: '#EC4899',
    strong: '#DB2777',
    soft: 'rgba(236, 72, 153, 0.2)',
    ring: 'rgba(219, 39, 119, 0.35)',
    textOnAccent: '#111111',
  },
  red: {
    solid: '#EF4444',
    strong: '#DC2626',
    soft: 'rgba(239, 68, 68, 0.2)',
    ring: 'rgba(220, 38, 38, 0.38)',
    textOnAccent: '#111111',
  },
};

export const SEMANTIC_STATE_COLORS = {
  error: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  info: '#2563EB',
  errorSoftLight: 'rgba(220, 38, 38, 0.12)',
  warningSoftLight: 'rgba(217, 119, 6, 0.14)',
  successSoftLight: 'rgba(22, 163, 74, 0.12)',
  infoSoftLight: 'rgba(37, 99, 235, 0.12)',
  errorSoftDark: 'rgba(220, 38, 38, 0.2)',
  warningSoftDark: 'rgba(217, 119, 6, 0.22)',
  successSoftDark: 'rgba(22, 163, 74, 0.2)',
  infoSoftDark: 'rgba(37, 99, 235, 0.2)',
} as const;

export type ThemeNeutralPalette = {
  bgCanvas: RgbHexColor;
  bgSurface: RgbHexColor;
  bgSurfaceElevated: RgbHexColor;
  bgMuted: RgbHexColor;
  textPrimary: RgbHexColor;
  textSecondary: RgbaColor;
  textMuted: RgbaColor;
  borderSubtle: RgbaColor;
  borderStrong: RgbaColor;
};

export const THEME_NEUTRAL_PALETTES: Record<Theme, ThemeNeutralPalette> = {
  light: {
    bgCanvas: '#FFFFFF',
    bgSurface: '#FFFFFF',
    bgSurfaceElevated: '#FFFFFF',
    bgMuted: '#F5F5F5',
    textPrimary: '#0A0A0A',
    textSecondary: 'rgba(0, 0, 0, 0.75)',
    textMuted: 'rgba(0, 0, 0, 0.62)',
    borderSubtle: 'rgba(0, 0, 0, 0.12)',
    borderStrong: 'rgba(0, 0, 0, 0.22)',
  },
  dark: {
    bgCanvas: '#101214',
    bgSurface: '#161A1D',
    bgSurfaceElevated: '#1E2328',
    bgMuted: '#21272D',
    textPrimary: '#F5F7FA',
    textSecondary: 'rgba(245, 247, 250, 0.78)',
    textMuted: 'rgba(245, 247, 250, 0.62)',
    borderSubtle: 'rgba(255, 255, 255, 0.12)',
    borderStrong: 'rgba(255, 255, 255, 0.22)',
  },
};

export const WCAG_CONTRAST_THRESHOLDS = {
  text: 4.5,
  largeText: 3,
  nonText: 3,
} as const;
