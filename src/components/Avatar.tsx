import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Group, SkinnedMesh } from 'three';
import { AVATAR_URL } from '@/lib/config';
import { useBreathing } from '@/hooks/useBreathing';
import { useBlink } from '@/hooks/useBlink';
import { useTalkingHeadLipSync } from '@/hooks/useTalkingHeadLipSync';
import { useHeadTracking } from '@/hooks/useHeadTracking';
import type { ScheduledViseme } from '@/lib/lipsync/visemeTimeline';

useGLTF.preload(AVATAR_URL);

interface AvatarProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  timeline: ScheduledViseme[];
}

export default function Avatar({ audioRef, analyserRef, isPlaying, timeline }: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const morphMeshesRef = useRef<SkinnedMesh[]>([]);
  const { scene } = useGLTF(AVATAR_URL);

  const morphMeshes = useMemo<SkinnedMesh[]>(() => {
    const found: SkinnedMesh[] = [];
    scene.traverse((obj) => {
      const mesh = obj as SkinnedMesh;
      if (mesh.isSkinnedMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        found.push(mesh);
      }
    });
    return found;
  }, [scene]);

  useEffect(() => {
    morphMeshesRef.current = morphMeshes;
    if (!morphMeshes.length) {
      console.warn('[Avatar] No skinned meshes with morph targets found.');
      return;
    }
    for (const mesh of morphMeshes) {
      console.log(
        '[Avatar] morph targets on',
        mesh.name,
        Object.keys(mesh.morphTargetDictionary ?? {}),
      );
    }
  }, [morphMeshes]);

  useBreathing(groupRef);
  useBlink(morphMeshesRef);
  useTalkingHeadLipSync(morphMeshesRef, { audioRef, analyserRef, isPlaying, timeline });
  useHeadTracking(groupRef);

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}
