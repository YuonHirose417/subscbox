import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore } from '@/features/settings/store';

import {
  accentPresets,
  accentShadow,
  categoryColors,
  motion,
  palettes,
  radius,
  shadows,
  sizes,
  spacing,
  type Accent,
  type ColorScheme,
  type Palette,
} from './tokens';
import { typography } from './typography';

export type Theme = {
  scheme: ColorScheme;
  colors: Palette;
  accent: Accent;
  categoryColors: typeof categoryColors;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: string | undefined;
  accentShadow: string | undefined;
  motion: typeof motion;
  sizes: typeof sizes;
  typography: typeof typography;
};

export const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore((s) => s.themePreference);
  const accentPreset = useSettingsStore((s) => s.accentPreset);
  const { isPremium } = usePremium();

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const presetId = isPremium ? accentPreset : 'default';

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: palettes[scheme],
      accent: accentPresets[presetId][scheme],
      categoryColors,
      spacing,
      radius,
      shadow: shadows[scheme],
      accentShadow: accentShadow[scheme],
      motion,
      sizes,
      typography,
    }),
    [scheme, presetId],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
