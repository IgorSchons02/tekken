import { Platform } from "react-native";

// Tekken Tournament Dark Theme
export const TekkenTheme = {
  // Core colors
  background: "#0A0A0F",
  backgroundLight: "#12121A",
  card: "#1A1A2E",
  cardLight: "#222240",
  surface: "#16213E",

  // Accent colors
  primary: "#E94560",
  primaryLight: "#FF6B81",
  secondary: "#FFD700",
  secondaryLight: "#FFE44D",
  accent: "#533483",
  accentLight: "#7B4FBF",

  // Status colors
  success: "#00E676",
  successDark: "#00C853",
  warning: "#FFAB00",
  warningDark: "#FF8F00",
  info: "#00B0FF",
  infoDark: "#0091EA",
  danger: "#FF1744",

  // Text colors
  text: "#FFFFFF",
  textSecondary: "#A0A0B8",
  textMuted: "#6B6B80",
  textInverse: "#0A0A0F",

  // Border & dividers
  border: "#2A2A3E",
  divider: "#1E1E30",

  // Gradient presets (for LinearGradient if added)
  gradientPrimary: ["#E94560", "#533483"],
  gradientGold: ["#FFD700", "#FF8C00"],
  gradientDark: ["#0A0A0F", "#1A1A2E"],
  gradientCard: ["#1A1A2E", "#16213E"],
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Font sizes
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
  hero: 48,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: "#E94560",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#E94560",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#E94560",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: "#E94560",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  gold: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Legacy support
export const Colors = {
  light: {
    text: "#FFFFFF",
    background: "#0A0A0F",
    tint: "#E94560",
    icon: "#A0A0B8",
    tabIconDefault: "#6B6B80",
    tabIconSelected: "#E94560",
  },
  dark: {
    text: "#FFFFFF",
    background: "#0A0A0F",
    tint: "#E94560",
    icon: "#A0A0B8",
    tabIconDefault: "#6B6B80",
    tabIconSelected: "#E94560",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
