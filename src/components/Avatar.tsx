import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { readAvatar } from '@/lib/avatar/loadAvatar';
import { IDLE_ANIM_URL, TALKING_ANIM_URL } from '@/lib/config';
import { useBreathing } from '@/hooks/useBreathing';
import { useBlink } from '@/hooks/useBlink';
import { useTalkingHeadLipSync } from '@/hooks/useTalkingHeadLipSync';
import { useHeadTracking } from '@/hooks/useHeadTracking';
import { useBodyAnimation } from '@/hooks/useBodyAnimation';
import type { ScheduledViseme } from '@/lib/lipsync/visemeTimeline';

interface AvatarProps {
  url: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
}

export default function Avatar({ url, audioRef, analyserRef, isPlaying, timeline }: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const rig = readAvatar(url);

  useBreathing(groupRef);
  useBlink(rig);
  useTalkingHeadLipSync(rig, { audioRef, analyserRef, isPlaying, timeline });
  useHeadTracking(rig);
  useBodyAnimation(rig, IDLE_ANIM_URL, TALKING_ANIM_URL, isPlaying);

  // Registered last so it runs after every other useFrame in this component:
  // mixer.update() consumes the weights set by useBodyAnimation, then VRM's
  // expressionManager flushes mouth/blink, and spring bones tick.
  useFrame((_, delta) => rig.tick(delta));

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={rig.scene} />
    </group>
  );
}
