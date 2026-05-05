import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Object3D } from 'three';
import type { AvatarRig } from '@/lib/avatar/rig';

const YAW_RANGE = 0.35;
const PITCH_RANGE = 0.25;
const DAMP_LAMBDA = 4;

export function useHeadTracking(rig: AvatarRig | null) {
  const headRef = useRef<Object3D | null>(null);
  const baseRot = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const head = rig?.getHeadBone() ?? null;
    headRef.current = head;
    baseRot.current = head ? { x: head.rotation.x, y: head.rotation.y } : null;
  }, [rig]);

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
