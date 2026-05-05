import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Group, SkinnedMesh } from 'three';
import { AVATAR_URL } from '@/lib/config';
import { useBreathing } from '@/hooks/useBreathing';
import { useBlink } from '@/hooks/useBlink';
import { useLipSync } from '@/hooks/useLipSync';
import { useHeadTracking } from '@/hooks/useHeadTracking';

useGLTF.preload(AVATAR_URL);

interface AvatarProps {
  speaking: boolean;
}

export default function Avatar({ speaking }: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const faceMeshRef = useRef<SkinnedMesh | null>(null);
  const { scene } = useGLTF(AVATAR_URL);

  const faceMesh = useMemo<SkinnedMesh | null>(() => {
    let found: SkinnedMesh | null = null;
    scene.traverse((obj) => {
      const mesh = obj as SkinnedMesh;
      if (
        !found &&
        mesh.isSkinnedMesh &&
        mesh.morphTargetDictionary &&
        Object.keys(mesh.morphTargetDictionary).some((k) => k.startsWith('viseme_'))
      ) {
        found = mesh;
      }
    });
    return found;
  }, [scene]);

  useEffect(() => {
    faceMeshRef.current = faceMesh;
    if (!faceMesh) {
      console.warn('[Avatar] No face mesh with viseme_* morph targets found.');
    } else {
      console.log(
        '[Avatar] Morph targets on',
        faceMesh.name,
        Object.keys(faceMesh.morphTargetDictionary ?? {}),
      );
    }
  }, [faceMesh]);

  useBreathing(groupRef);
  useBlink(faceMeshRef);
  useLipSync(faceMeshRef, { enabled: speaking });
  useHeadTracking(groupRef);

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}
