import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Matrix4, Vector3 } from 'three';

const COUNT = 200;
const SPAWN_RADIUS = 4;
const Y_MIN = -1.5;
const Y_MAX = 4;
const COLOR = new Color('#a855f7');

interface ParticleData {
  position: Vector3;
  speed: number;
  scale: number;
  swayPhase: number;
  swayAmp: number;
}

export default function Particles() {
  const ref = useRef<InstancedMesh>(null);

  const particles = useMemo<ParticleData[]>(() => {
    const arr: ParticleData[] = [];
    for (let i = 0; i < COUNT; i += 1) {
      arr.push({
        position: new Vector3(
          (Math.random() - 0.5) * SPAWN_RADIUS * 2,
          Y_MIN + Math.random() * (Y_MAX - Y_MIN),
          (Math.random() - 0.5) * SPAWN_RADIUS * 2,
        ),
        speed: 0.02 + Math.random() * 0.06,
        scale: 0.005 + Math.random() * 0.015,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmp: 0.0005 + Math.random() * 0.0015,
      });
    }
    return arr;
  }, []);

  const matrix = useMemo(() => new Matrix4(), []);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = performance.now() * 0.001;

    for (let i = 0; i < COUNT; i += 1) {
      const p = particles[i];
      p.position.y += p.speed * delta;
      p.position.x += Math.sin(t + p.swayPhase) * p.swayAmp;
      if (p.position.y > Y_MAX) {
        p.position.y = Y_MIN;
        p.position.x = (Math.random() - 0.5) * SPAWN_RADIUS * 2;
        p.position.z = (Math.random() - 0.5) * SPAWN_RADIUS * 2;
      }
      matrix.makeScale(p.scale, p.scale, p.scale);
      matrix.setPosition(p.position);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={COLOR} transparent opacity={0.85} toneMapped={false} />
    </instancedMesh>
  );
}
