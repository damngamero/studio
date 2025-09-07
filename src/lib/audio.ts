
export type Sound = 'click' | 'notification' | 'achievement';

export function playSound(sound: Sound) {
  if (typeof window !== 'undefined') {
    const audioEl = document.getElementById(`audio-${sound}`) as HTMLAudioElement | null;
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.play().catch(error => {
        // Ignore errors from browser autoplay policies
        if (error.name !== 'NotAllowedError') {
          console.error(`Could not play sound '${sound}':`, error);
        }
      });
    }
  }
}
