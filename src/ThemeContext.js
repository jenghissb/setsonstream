import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const saved = localStorage.getItem('theme');
  const initialtheme = saved || (prefersLight ? 'light' : null); // null → use default (dark)

  const [theme, setTheme] = useState(initialtheme); // Initial theme

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]); // Re-run effect when theme changes

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};



  // const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  // const saved = localStorage.getItem('theme');
  // const initialtheme = saved || (prefersLight ? 'light' : null); // null → use default (dark)
  // document.documentElement.setAttribute('data-theme', initialtheme);

  // const [theme, setTheme] = useState(initialtheme);
  // const [isFeedbackOpen, setFeedbackOpen] = useState(false);

  // useEffect(() => {
  //   console.log("setting data theme!!!!!!", theme)
  //   document.documentElement.setAttribute('data-theme', theme);
  //   localStorage.setItem('theme', theme);
  // }, [theme]);

  // const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
