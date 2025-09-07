
'use client';

// This component is designed to be included once in the main layout.
// It preloads the audio files so they are ready to be played by the playSound utility.
export function SoundPlayer() {
  return (
    <>
      <audio id="audio-click" src="https://firebasestorage.googleapis.com/v0/b/genkit-llm-tools.appspot.com/o/pop-sound.mp3?alt=media&token=2343250b-333e-4621-a4a3-7b8e75871587" preload="auto"></audio>
      <audio id="audio-notification" src="https://firebasestorage.googleapis.com/v0/b/genkit-llm-tools.appspot.com/o/notification-sound.mp3?alt=media&token=57e4e1de-b565-4f8a-939a-65b843813abd" preload="auto"></audio>
      <audio id="audio-achievement" src="https://firebasestorage.googleapis.com/v0/b/genkit-llm-tools.appspot.com/o/achievement-sound.mp3?alt=media&token=8660e1d5-b873-45c1-8417-31346d030999" preload="auto"></audio>
    </>
  );
}
