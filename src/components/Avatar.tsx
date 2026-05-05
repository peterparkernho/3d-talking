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
  useLipSync(morphMeshesRef, { enabled: speaking });
  useHeadTracking(groupRef);

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}
