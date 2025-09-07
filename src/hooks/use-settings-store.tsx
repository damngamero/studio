
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as cookie from 'cookie';

const SETTINGS_KEY = 'verdantwise-settings';

export type Theme = "light" | "dark" | "theme-forest" | "theme-sunny-meadow";

export interface Settings {
  theme: Theme;
  wateringReminders: boolean;
  timezone: string;
  location: string;
  geminiApiKey?: string;
}

const defaultSettings: Settings = {
  theme: "light",
  wateringReminders: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  location: "",
  geminiApiKey: "",
};

// This function can be called from server components or server actions
export function getSettings(): Settings {
  if (typeof window === 'undefined') {
    // In a server context, we try to read from cookies
    try {
        const { headers } = require('next/headers');
        const cookieHeader = headers().get('cookie');
        if (cookieHeader) {
            const cookies = cookie.parse(cookieHeader);
            const settingsCookie = cookies[SETTINGS_KEY];
            if (settingsCookie) {
                return { ...defaultSettings, ...JSON.parse(settingsCookie) };
            }
        }
    } catch (e) {
        // This might fail if called outside a request context, fall back to defaults
        return defaultSettings;
    }
    return defaultSettings;
  }
  // On the client, we prefer localStorage
  try {
    const item = window.localStorage.getItem(SETTINGS_KEY);
    if (item) {
      const savedSettings = JSON.parse(item);
      return { ...defaultSettings, ...savedSettings };
    }
    return defaultSettings;
  }
  catch (error) {
    console.error('Error reading settings from localStorage', error);
    return defaultSettings;
  }
}

function getInitialClientSettings(): Settings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  try {
    const item = window.localStorage.getItem(SETTINGS_KEY);
    if (item) {
      const savedSettings = JSON.parse(item);
      return { ...defaultSettings, ...savedSettings };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error reading settings from localStorage', error);
    return defaultSettings;
  }
}

export function useSettingsStore() {
  const [settings, setSettingsState] = useState<Settings>(getInitialClientSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Correctly initialize state on the client
    setSettingsState(getInitialClientSettings());
    setIsInitialized(true);
  }, []);
  
  useEffect(() => {
    if (isInitialized) {
        try {
            // Sync to both localStorage and a cookie
            const settingsString = JSON.stringify(settings);
            window.localStorage.setItem(SETTINGS_KEY, settingsString);
            document.cookie = cookie.serialize(SETTINGS_KEY, settingsString, { path: '/', maxAge: 60 * 60 * 24 * 365 });

        } catch (error) {
            console.error('Error writing settings to storage', error);
        }
    }
  }, [settings, isInitialized]);


  const setSettings = useCallback((newSettings: Settings) => {
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
