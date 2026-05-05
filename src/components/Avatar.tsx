import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AVATAR_URL } from '@/lib/config';
import { readAvatar } from '@/lib/avatar/loadAvatar';
import { useBreathing } from '@/hooks/useBreathing';
import { useBlink } from '@/hooks/useBlink';
import { useTalkingHeadLipSync } from '@/hooks/useTalkingHeadLipSync';
import { useHeadTracking } from '@/hooks/useHeadTracking';
import type { ScheduledViseme } from '@/lib/lipsync/visemeTimeline';

interface AvatarProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
}

export default function Avatar({ audioRef, analyserRef, isPlaying, timeline }: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const rig = readAvatar(AVATAR_URL);

  useBreathing(groupRef);
  useBlink(rig);
  useTalkingHeadLipSync(rig, { audioRef, analyserRef, isPlaying, timeline });
  useHeadTracking(rig);

  // Registered last so it runs after every other useFrame in this component —
  // VRM's expressionManager flush + spring bones need the up-to-date weights.
  useFrame((_, delta) => rig.tick(delta));

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={rig.scene} />
    </group>
  );
}
