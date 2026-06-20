import React, { useEffect, useState, createContext, useContext } from 'react';
import { ThemeId, applyTheme, getStoredTheme, DEFAULT_THEME } from '../theme';
interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}
const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {}
});
export function ThemeProvider({ children }: {children: ReactNode;}) {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  const setTheme = (id: ThemeId) => setThemeState(id);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme
      }}>
      
      {children}
    </ThemeContext.Provider>);

}
export function useTheme() {
  return useContext(ThemeContext);
}