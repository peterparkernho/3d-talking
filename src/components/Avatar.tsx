import { useEffect, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import type { Group } from 'three';
import { AVATAR_URL } from '@/lib/config';
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
  const gltf = useLoader(GLTFLoader, AVATAR_URL, (loader) => {
    (loader as GLTFLoader).register((parser) => new VRMLoaderPlugin(parser));
  });
  const vrm = (gltf.userData.vrm as VRM | undefined) ?? null;

  useEffect(() => {
    if (!vrm) {
      console.warn('[Avatar] VRM data missing on loaded GLTF.');
      return;
    }
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);
    if (vrm.meta?.metaVersion === '0') VRMUtils.rotateVRM0(vrm);
    console.log('[Avatar] VRM loaded', {
      version: vrm.meta?.metaVersion,
      expressions: vrm.expressionManager
        ? Object.keys(vrm.expressionManager.expressionMap)
        : 'none',
    });
  }, [vrm, gltf]);

  useBreathing(groupRef);
  useBlink(vrm);
  useTalkingHeadLipSync(vrm, { audioRef, analyserRef, isPlaying, timeline });
  useHeadTracking(vrm);

  // Must run AFTER the hooks above so their setValue() calls are flushed
  // through expressionManager.update() and spring bones tick once per frame.
  useFrame((_, delta) => {
    if (vrm) vrm.update(delta);
  });

  return (
    <group ref={groupRef} dispose={null}>
      {vrm && <primitive object={vrm.scene} />}
    </group>
  );
}
