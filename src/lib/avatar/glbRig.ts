import {
  AnimationClip,
  AnimationMixer,
  Box3,
  KeyframeTrack,
  MathUtils,
  Vector3,
  type Bone,
  type Group,
  type Object3D,
  type SkinnedMesh,
} from 'three';
import {
  BLINK_KEYS_GLB,
  VISEMES,
  type VisemeKey,
} from '@/lib/lipsync/visemeMap';
import { GLB_RESERVED_BONES } from './mixamoVRMRigMap';
import {
  ARKIT_EMOTION_COMPOSITION,
  ARKIT_EMOTION_SHAPES,
  EMOTIONS,
  type EmotionName,
} from './emotions';
import type { AvatarRig } from './rig';

const DAMP_LAMBDA = 18;
const EMOTION_LAMBDA = 6;

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

type EmotionShapeIndex = Map<string, Map<SkinnedMesh, number>>;

function buildEmotionShapeIndex(meshes: SkinnedMesh[]): EmotionShapeIndex {
  const out: EmotionShapeIndex = new Map();
  for (const shape of ARKIT_EMOTION_SHAPES) {
    const perMesh = new Map<SkinnedMesh, number>();
    for (const mesh of meshes) {
      const dict = mesh.morphTargetDictionary;
      if (!dict) continue;
      const idx = dict[shape];
      if (idx !== undefined) perMesh.set(mesh, idx);
    }
    if (perMesh.size) out.set(shape, perMesh);
  }
  return out;
}

/**
 * GLBs come in wildly different scales (some authored at meters, some at cm,
 * some at half-height for stylized characters). The scene camera/target are
 * tuned for a ~1.7m human standing with feet at y=0, so we normalize every
 * GLB into that frame: uniform scale to TARGET_HEIGHT, then translate so the
 * bounding box bottom sits on y=0 and the horizontal center is at x=0,z=0.
 */
const TARGET_HEIGHT = 1.7;
// Small upward nudge so the head/torso sit closer to the camera target
// (y≈1.4) rather than dropping into the lower half of the frame.
const GROUND_OFFSET = 0.15;

function normalizeGlbTransform(scene: Object3D): void {
  // Make sure world matrices reflect the loader's authored transforms before
  // we measure — otherwise Box3.setFromObject reads stale matrices on nested
  // skinned meshes and returns a degenerate box.
  scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(scene);
  if (!isFinite(box.min.y) || !isFinite(box.max.y)) {
    console.warn('[glbRig] could not measure bounding box — skipping normalization.');
    return;
  }
  const size = new Vector3();
  box.getSize(size);
  if (size.y <= 0) return;

  const scale = TARGET_HEIGHT / size.y;
  scene.scale.multiplyScalar(scale);

  // Re-measure post-scale so the recenter math accounts for the new bounds.
  scene.updateMatrixWorld(true);
  const scaled = new Box3().setFromObject(scene);
  const center = new Vector3();
  scaled.getCenter(center);
  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= scaled.min.y;
  scene.position.y += GROUND_OFFSET;
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
  normalizeGlbTransform(scene);
  const meshes = collectMorphMeshes(scene);
  const visemeIdx = buildVisemeIndex(meshes);
  const blinkIdx = buildBlinkIndex(meshes);
  const emotionIdx = buildEmotionShapeIndex(meshes);
  const head = findHeadBone(scene);
  const mixer = new AnimationMixer(scene);

  if (visemeIdx.size === 0) {
    console.warn('[glbRig] no meshes with viseme_* morph targets — mouth will not animate.');
  }
  if (!head) console.warn('[glbRig] no head bone found.');
  if (emotionIdx.size === 0) {
    console.warn('[glbRig] no ARKit emotion morph targets found — emotions will be no-ops.');
  }

  const emotionWeights: Record<EmotionName, number> = {
    neutral: 1,
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    relaxed: 0,
  };

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
    applyEmotion(active, delta) {
      for (const k of EMOTIONS) {
        emotionWeights[k] = MathUtils.damp(
          emotionWeights[k],
          k === active ? 1 : 0,
          EMOTION_LAMBDA,
          delta,
        );
      }
      emotionIdx.forEach((perMesh, shape) => {
        let target = 0;
        for (const k of EMOTIONS) {
          const w = ARKIT_EMOTION_COMPOSITION[k][shape];
          if (w) target += emotionWeights[k] * w;
        }
        perMesh.forEach((idx, mesh) => {
          const inf = mesh.morphTargetInfluences;
          if (inf) inf[idx] = target;
        });
      });
    },
    getHeadBone() {
      return head;
    },
    retargetMixamoClip(asset: Group): AnimationClip {
      const clip =
        AnimationClip.findByName(asset.animations, 'mixamo.com') ?? asset.animations[0];
      if (!clip) throw new Error('[glbRig] FBX has no animation tracks');

      const tracks: KeyframeTrack[] = [];
      let droppedReserved = 0;
      let droppedPosition = 0;
      for (const track of clip.tracks) {
        const dot = track.name.indexOf('.');
        if (dot < 0) continue;
        const mixamoName = track.name.slice(0, dot);
        const property = track.name.slice(dot + 1);
        if (GLB_RESERVED_BONES.has(mixamoName)) {
          droppedReserved += 1;
          continue;
        }
        // Mixamo position tracks are in Mixamo's scale (~cm) and applying
        // them verbatim teleports the avatar out of frame. Rotations are
        // what we want for body language; vertical bob is handled by
        // useBreathing already. (VRM scales positions; GLB drops them.)
        if (property === 'position') {
          droppedPosition += 1;
          continue;
        }
        // Mixamo names look like `mixamorigSpine`; strip prefix to get RPM/GLB bone names.
        const targetBone = mixamoName.replace(/^mixamorig/, '');
        if (!targetBone) continue;
        if (!scene.getObjectByName(targetBone)) continue;
        const cloned = track.clone();
        cloned.name = `${targetBone}.${property}`;
        tracks.push(cloned);
      }
      if (tracks.length === 0) {
        throw new Error('[glbRig] no Mixamo tracks matched the GLB skeleton');
      }
      console.log(
        `[glbRig] retargeted ${tracks.length} tracks (dropped ${droppedReserved} reserved-bone, ${droppedPosition} position)`,
      );
      return new AnimationClip(clip.name, clip.duration, tracks);
    },
    playClip(clip) {
      const action = mixer.clipAction(clip);
      action.play();
      return action;
    },
    tick(delta) {
      mixer.update(delta);
    },
  };
}
