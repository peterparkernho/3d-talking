import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useRef } from 'react';

const AMPLITUDE = 0.01;
const FREQUENCY = 1.4;

export function useBreathing(groupRef: React.RefObject<Group | null>) {
  const baseY = useRef<number | null>(null);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    if (baseY.current === null) baseY.current = g.position.y;
    g.position.y = baseY.current + Math.sin(state.clock.elapsedTime * FREQUENCY) * AMPLITUDE;
  });
}
