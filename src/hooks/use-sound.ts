
'use client';

import { useCallback, useEffect } from 'react';
import { useSettingsStore } from './use-settings-store';
import { soundUrls } from '@/lib/sounds';

type Sound = keyof typeof soundUrls;

// This is a simple in-memory cache for the Audio objects
const audioCache: { [key in Sound]?: HTMLAudioElement } = {};

// We need to run this only once on the client
if (typeof window !== 'undefined') {
  Object.keys(soundUrls).forEach(key => {
    const soundKey = key as Sound;
    if (!audioCache[soundKey]) {
      const audio = new Audio(soundUrls[soundKey]);
      audio.preload = 'auto';
      audioCache[soundKey] = audio;
    }
  });
}

export function useSound() {
  const { settings } = useSettingsStore();

  const playSound = useCallback((sound: Sound) => {
    if (settings.soundEffectsEnabled && audioCache[sound]) {
      const audio = audioCache[sound]!;
      audio.currentTime = 0; // Rewind to start
      audio.play().catch(error => {
        // Autoplay can be blocked by the browser, which is fine.
        console.warn(`Could not play sound '${sound}':`, error);
      });
    }
  }, [settings.soundEffectsEnabled]);

  return playSound;
}
