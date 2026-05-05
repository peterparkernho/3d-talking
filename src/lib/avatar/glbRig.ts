import { MathUtils, type Bone, type Object3D, type SkinnedMesh } from 'three';
import {
  BLINK_KEYS_GLB,
  VISEMES,
  type VisemeKey,
} from '@/lib/lipsync/visemeMap';
import type { AvatarRig } from './rig';

const DAMP_LAMBDA = 18;

type VisemeIndexMap = Map<SkinnedMesh, Partial<Record<VisemeKey, number>>>;
type BlinkIndexMap = Map<SkinnedMesh, number[]>;

function collectMorphMeshes(scene: Object3D): SkinnedMesh[] {
  const out: SkinnedMesh[] = [];
  scene.traverse((obj) => {
    const m = obj as SkinnedMesh;
    if (m.isSkinnedMesh && m.morphTargetDictionary && m.morphTargetInfluences) out.push(m);
  });
  return out;
}

function buildVisemeIndex(meshes: SkinnedMesh[]): VisemeIndexMap {
  const out: VisemeIndexMap = new Map();
  for (const mesh of meshes) {
    const dict = mesh.morphTargetDictionary;
    if (!dict) continue;
    const map: Partial<Record<VisemeKey, number>> = {};
    let any = false;
    for (const k of VISEMES) {
      const idx = dict[k];
      if (idx !== undefined) {
        map[k] = idx;
        any = true;
      }
    }
    if (any) out.set(mesh, map);
  }
  return out;
}

function buildBlinkIndex(meshes: SkinnedMesh[]): BlinkIndexMap {
  const out: BlinkIndexMap = new Map();
  for (const mesh of meshes) {
    const dict = mesh.morphTargetDictionary;
    if (!dict) continue;
    const indices: number[] = [];
    for (const k of BLINK_KEYS_GLB) {
      const idx = dict[k];
      if (idx !== undefined) indices.push(idx);
    }
    if (indices.length) out.set(mesh, indices);
  }
  return out;
}

function findHeadBone(root: Object3D): Bone | null {
  let found: Bone | null = null;
  root.traverse((obj) => {
    if (found) return;
    const b = obj as Bone;
    if (b.isBone && /^head$/i.test(b.name)) found = b;
  });
  return found;
}

export function createGlbRig(scene: Object3D): AvatarRig {
  const meshes = collectMorphMeshes(scene);
  const visemeIdx = buildVisemeIndex(meshes);
  const blinkIdx = buildBlinkIndex(meshes);
  const head = findHeadBone(scene);

  if (visemeIdx.size === 0) {
    console.warn('[glbRig] no meshes with viseme_* morph targets — mouth will not animate.');
  }
  if (!head) console.warn('[glbRig] no head bone found.');

  return {
    scene,
    applyMouthVisemes(visemeWeights, volumeGain, delta) {
      visemeIdx.forEach((map, mesh) => {
        const inf = mesh.morphTargetInfluences;
        if (!inf) return;
        for (const k of VISEMES) {
          const idx = map[k];
          if (idx === undefined) continue;
          const target = (visemeWeights?.get(k) ?? 0) * volumeGain;
          inf[idx] = MathUtils.damp(inf[idx], target, DAMP_LAMBDA, delta);
        }
      });
    },
    applyBlink(weight) {
      blinkIdx.forEach((indices, mesh) => {
        const inf = mesh.morphTargetInfluences;
        if (!inf) return;
        for (const idx of indices) inf[idx] = weight;
      });
    },
    getHeadBone() {
      return head;
    },
    tick() {
      // GLB has no per-frame engine state to flush.
    },
  };
}
