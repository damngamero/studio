"use client";

import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'verdantwise-settings';

export type Theme = "light" | "dark" | "theme-forest";

export interface Settings {
  theme: Theme;
  wateringReminders: boolean;
  metricUnits: boolean;
}

const defaultSettings: Settings = {
  theme: "light",
  wateringReminders: true,
  metricUnits: false,
};

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

  useEffect(() => {
    setSettingsState(getInitialSettings());
  }, []);

  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettingsState(updatedSettings);
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      if (newSettings.theme && newSettings.theme !== settings.theme) {
        document.documentElement.className = newSettings.theme;
      }
    } catch (error) {
      console.error('Error writing settings to localStorage', error);
    }
  }, [settings]);

  return { settings, setSettings, theme: settings.theme };
}
