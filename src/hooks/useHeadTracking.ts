import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Object3D } from 'three';
import type { VRM } from '@pixiv/three-vrm';

const YAW_RANGE = 0.35;
const PITCH_RANGE = 0.25;
const DAMP_LAMBDA = 4;

export function useHeadTracking(vrm: VRM | null) {
  const headRef = useRef<Object3D | null>(null);
  const baseRot = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const head = vrm?.humanoid?.getNormalizedBoneNode('head') ?? null;
    headRef.current = head;
    if (head) {
      baseRot.current = { x: head.rotation.x, y: head.rotation.y };
    } else if (vrm) {
      console.warn('[useHeadTracking] no humanoid head bone found.');
    }
  }, [vrm]);

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
