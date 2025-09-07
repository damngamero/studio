
'use client';

import { useCallback } from 'react';
import { useSettingsStore } from './use-settings-store';

const soundUrls = {
  click: 'https://cdn.pixabay.com/download/audio/2023/09/14/audio_37632ff397.mp3', // A reliable pop sound
  notification: 'https://cdn.pixabay.com/audio/2022/03/10/audio_e09618c9a8.mp3',
  achievement: 'https://cdn.pixabay.com/audio/2022/03/24/audio_a752a30999.mp3',
};

export type Sound = keyof typeof soundUrls;

export function useSound() {
  const { settings } = useSettingsStore();

  const playSound = useCallback((sound: Sound) => {
    if (settings.soundEffectsEnabled && typeof window !== 'undefined') {
      try {
        const audio = new Audio(soundUrls[sound]);
        audio.play().catch(error => {
           if (error.name !== 'NotAllowedError') {
            console.warn(`Could not play sound '${sound}':`, error);
          }
        });
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }
  }, [settings.soundEffectsEnabled]);

  return playSound;
}
