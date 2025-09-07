
'use client';

// This component is meant to be used once in the root layout.
// It renders the audio elements so they are part of the DOM and can be played.
export function SoundPlayer() {
  return (
    <>
      <audio id="audio-click" src="https://cdn.pixabay.com/download/audio/2023/09/14/audio_37632ff397.mp3" preload="auto"></audio>
      <audio id="audio-notification" src="https://cdn.pixabay.com/audio/2022/03/10/audio_e09618c9a8.mp3" preload="auto"></audio>
      <audio id="audio-achievement" src="https://cdn.pixabay.com/audio/2022/03/24/audio_a752a30999.mp3" preload="auto"></audio>
    </>
  );
}
