import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Html, useProgress } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import Avatar from '@/components/Avatar';
import Particles from '@/scene/Particles';
import type { ScheduledViseme } from '@/lib/lipsync/visemeTimeline';

const isDev = import.meta.env.DEV;

interface SceneProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
  isMobile: boolean;
}

function Loader() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <Html center>
      <div
        style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
        }}
      >
        Loading {Math.round(progress)}%
      </div>
    </Html>
  );
}

export default function Scene({ audioRef, analyserRef, isPlaying, timeline, isMobile }: SceneProps) {
  const cameraPosition: [number, number, number] = isMobile ? [0, 1.5, 3.2] : [0, 1.5, 2.5];
  const fov = isMobile ? 32 : 35;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: cameraPosition, fov }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} />

      <Suspense fallback={<Loader />}>
        <Environment preset="city" />
        <Avatar
          audioRef={audioRef}
          analyserRef={analyserRef}
          isPlaying={isPlaying}
          timeline={timeline}
        />
      </Suspense>

      <Particles />

      <EffectComposer>
        <Bloom intensity={0.4} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
      </EffectComposer>

      <OrbitControls
        target={[0, 1.4, 0]}
        enabled={!isMobile}
        enablePan={false}
        minDistance={1.2}
        maxDistance={5}
      />
      {isDev && !isMobile && <axesHelper args={[1]} />}
    </Canvas>
  );
}
