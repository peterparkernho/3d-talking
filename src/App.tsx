import { Suspense, lazy, useState } from 'react';
import StartGate from '@/components/StartGate';
import ChatBar from '@/components/ChatBar';
import { useAgent } from '@/hooks/useAgent';
import { useIsMobile } from '@/hooks/useIsMobile';

const Scene = lazy(() => import('@/scene/Scene'));

export default function App() {
  const [started, setStarted] = useState(false);
  const isMobile = useIsMobile();
  const agent = useAgent();

  const handleStart = () => {
    setStarted(true);
  };

  const handleSend = (text: string) => {
    void agent.send(text).catch((err) => console.error('[agent.send]', err));
  };

  return (
    <div className="app-root">
      <Suspense fallback={null}>
        <Scene
          audioRef={agent.audioRef}
          isPlaying={agent.isPlaying}
          timeline={agent.timeline}
          isMobile={isMobile}
        />
      </Suspense>
      {!started && <StartGate onStart={handleStart} isReady />}
      {started && (
        <ChatBar
          mode={agent.mode}
          isSending={agent.isSending}
          isPlaying={agent.isPlaying}
          isMuted={agent.isMuted}
          lastReply={agent.text}
          onSend={handleSend}
          onStop={agent.stop}
          onToggleMute={agent.toggleMute}
        />
      )}
    </div>
  );
}
