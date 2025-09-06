
"use client";

import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'verdantwise-settings';

export type Theme = "light" | "dark" | "theme-forest" | "theme-sunny-meadow";
export type AIModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';

export interface Settings {
  theme: Theme;
  wateringReminders: boolean;
  metricUnits: boolean;
  timezone: string;
  location: string;
  model: AIModel;
}

const defaultSettings: Settings = {
  theme: "light",
  wateringReminders: true,
  metricUnits: false,
  timezone: "UTC",
  location: "",
  model: 'gemini-2.5-flash',
};

// This function can be called from server components
export function getSettings(): Settings {
    // In a real app, you might get this from a cookie or a server-side session
    return defaultSettings;
}


function getInitialSettings(): Settings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  try {
    const item = window.localStorage.getItem(SETTINGS_KEY);
    if (item) {
      return { ...defaultSettings, ...JSON.parse(item) };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error reading settings from localStorage', error);
    return defaultSettings;
  }
}

export function useSettingsStore() {
  const [settings, setSettingsState] = useState<Settings>(getInitialSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  useEffect(() => {
    if (isInitialized) {
        try {
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error writing settings to localStorage', error);
        }
    }
  }, [settings, isInitialized]);


  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
       if (newSettings.theme && newSettings.theme !== prevSettings.theme) {
        document.documentElement.className = newSettings.theme;
      }
      return updatedSettings;
    });
  }, []);

  return { settings, setSettings, theme: settings.theme, isInitialized };
}
