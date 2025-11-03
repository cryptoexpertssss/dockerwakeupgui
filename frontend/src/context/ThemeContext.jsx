import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  // Load theme from settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const response = await axios.get(`${API}/settings`);
        const savedTheme = response.data.theme || 'dark';
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
        // Default to dark theme
        applyTheme('dark');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  const applyTheme = (newTheme) => {
    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    // Add new theme class
    document.documentElement.classList.add(newTheme);
    // Update data attribute for CSS
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);

    // Save to backend
    try {
      const response = await axios.get(`${API}/settings`);
      const settings = response.data;
      settings.theme = newTheme;
      await axios.post(`${API}/settings`, settings);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setThemeValue = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeValue, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
