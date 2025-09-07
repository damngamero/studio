
'use client';

export const playSound = (soundId: 'click' | 'notification' | 'achievement') => {
  if (typeof window !== 'undefined') {
    const audio = document.getElementById(`audio-${soundId}`) as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => console.error(`Error playing sound ${soundId}:`, error));
    }
  }
};
