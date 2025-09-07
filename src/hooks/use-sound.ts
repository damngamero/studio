
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from './use-settings-store';
import { soundUrls } from '@/lib/sounds';

type Sound = keyof typeof soundUrls;

// Preload audio elements
let audioElements: { [key in Sound]?: HTMLAudioElement } = {};

export function useSound() {
  const { settings } = useSettingsStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Object.keys(soundUrls).forEach(key => {
        const soundKey = key as Sound;
        if (!audioElements[soundKey]) {
          audioElements[soundKey] = new Audio(soundUrls[soundKey]);
          audioElements[soundKey]!.preload = 'auto';
        }
      });
      setIsLoaded(true);
    }
  }, []);

  const playSound = useCallback((sound: Sound) => {
    if (settings.soundEffectsEnabled && isLoaded && audioElements[sound]) {
      const audio = audioElements[sound]!;
      audio.currentTime = 0; // Rewind to start
      audio.play().catch(error => {
        // Autoplay can be blocked by the browser, we'll just log it.
        console.warn(`Could not play sound: ${sound}`, error);
      });
    }
  }, [settings.soundEffectsEnabled, isLoaded]);

  return playSound;
}
