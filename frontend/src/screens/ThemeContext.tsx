import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');

  // Update theme if system color scheme changes
  React.useEffect(() => {
    if (systemColorScheme) setTheme(systemColorScheme);
  }, [systemColorScheme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 