
'use client';

// This component is meant to be used once in the root layout.
// It renders the audio elements so they are part of the DOM and can be played.
export function SoundPlayer() {
  return (
    <>
      <audio id="audio-click" src="https://cdn.pixabay.com/download/audio/2023/09/24/audio_34b8c6a0b2.mp3" preload="auto"></audio>
      <audio id="audio-notification" src="https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/bell.png" preload="auto"></audio>
      <audio id="audio-achievement" src="https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/tada.png" preload="auto"></audio>
    </>
  );
}
