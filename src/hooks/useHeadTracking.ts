import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Bone, Object3D } from 'three';

const YAW_RANGE = 0.35;
const PITCH_RANGE = 0.25;
const DAMP_LAMBDA = 4;

function findHeadBone(root: Object3D | null): Bone | null {
  if (!root) return null;
  let found: Bone | null = null;
  root.traverse((obj) => {
    if (found) return;
    const b = obj as Bone;
    if (b.isBone && /^head$/i.test(b.name)) found = b;
  });
  return found;
}

export function useHeadTracking(rootRef: React.RefObject<Object3D | null>) {
  const headRef = useRef<Bone | null>(null);
  const baseRot = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const head = findHeadBone(rootRef.current);
    headRef.current = head;
    if (head) {
      baseRot.current = { x: head.rotation.x, y: head.rotation.y };
    } else {
      console.warn('[useHeadTracking] no Head bone found.');
    }
  }, [rootRef]);

  useFrame((state, delta) => {
    const head = headRef.current;
    const base = baseRot.current;
    if (!head || !base) return;
    const targetY = base.y + state.pointer.x * YAW_RANGE;
    const targetX = base.x - state.pointer.y * PITCH_RANGE;
    head.rotation.y = MathUtils.damp(head.rotation.y, targetY, DAMP_LAMBDA, delta);
    head.rotation.x = MathUtils.damp(head.rotation.x, targetX, DAMP_LAMBDA, delta);
  });
}
