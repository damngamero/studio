
import { soundUrls } from './sounds';

export type Sound = keyof typeof soundUrls;

let audioCache: { [key in Sound]?: HTMLAudioElement };

// Initialize audio elements on the client side
if (typeof window !== 'undefined') {
  audioCache = Object.keys(soundUrls).reduce((acc, key) => {
    const soundKey = key as Sound;
    const audio = new Audio(soundUrls[soundKey]);
    audio.preload = 'auto';
    acc[soundKey] = audio;
    return acc;
  }, {} as { [key in Sound]?: HTMLAudioElement });
}

export function playAudio(sound: Sound) {
  if (audioCache && audioCache[sound]) {
    const audio = audioCache[sound]!;
    audio.currentTime = 0; // Rewind to start
    audio.play().catch(error => {
      // Autoplay can be blocked by the browser, which is fine.
      // We don't want to spam the console for this expected behavior.
      if (error.name !== 'NotAllowedError') {
        console.warn(`Could not play sound '${sound}':`, error);
      }
    });
  }
}
