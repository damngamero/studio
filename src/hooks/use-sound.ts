
'use client';

import { useCallback } from 'react';
import { useSettingsStore } from './use-settings-store';
import { playAudio, type Sound } from '@/lib/audio';


export function useSound() {
  const { settings } = useSettingsStore();

  const playSound = useCallback((sound: Sound) => {
    if (settings.soundEffectsEnabled) {
      playAudio(sound);
    }
  }, [settings.soundEffectsEnabled]);

  return playSound;
}
