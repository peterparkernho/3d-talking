import { Suspense, lazy, useState } from 'react';
import Controls from '@/components/Controls';
import StartGate from '@/components/StartGate';
import { useAudio } from '@/hooks/useAudio';
import { useIsMobile } from '@/hooks/useIsMobile';

const Scene = lazy(() => import('@/scene/Scene'));

const SAMPLE_AUDIO_SRC = '/sample.mp3';

export default function App() {
  const [started, setStarted] = useState(false);
  const isMobile = useIsMobile();
  const { isPlaying, isReady, isMuted, play, toggle, toggleMute } = useAudio(SAMPLE_AUDIO_SRC);

  const handleStart = () => {
    setStarted(true);
    void play();
  };

  return (
    <div className="app-root">
      <Suspense fallback={null}>
        <Scene speaking={isPlaying} isMobile={isMobile} />
      </Suspense>
      {!started && <StartGate onStart={handleStart} isReady={isReady} />}
      {started && (
        <Controls
          isPlaying={isPlaying}
          isReady={isReady}
          isMuted={isMuted}
          onToggle={toggle}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
}
