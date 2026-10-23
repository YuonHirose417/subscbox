import { useContext } from 'react';

import { ThemeContext, type Theme } from './ThemeProvider';

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme は ThemeProvider の内側で使ってください');
  }
  return theme;
}
