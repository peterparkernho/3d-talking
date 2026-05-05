import {
  AnimationClip,
  AnimationMixer,
  KeyframeTrack,
  MathUtils,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
  type Group,
} from 'three';
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import {
  BLINK_EXPRESSION,
  VISEMES,
  VISEME_TO_VRM,
  VRM_MOUTH_EXPRESSIONS,
  type VrmMouthExpression,
} from '@/lib/lipsync/visemeMap';
import { mixamoVRMRigMap, VRM_RESERVED_BONES } from './mixamoVRMRigMap';
import { EMOTIONS, VRM_EMOTION_PRESETS, type EmotionName } from './emotions';
import type { AvatarRig } from './rig';

const DAMP_LAMBDA = 18;
const EMOTION_LAMBDA = 6;

export function createVrmRig(vrm: VRM): AvatarRig {
  const smoothed: Record<VrmMouthExpression, number> = {
    aa: 0,
    ih: 0,
    ou: 0,
    ee: 0,
    oh: 0,
  };
  const targetBuf: Record<VrmMouthExpression, number> = {
    aa: 0,
    ih: 0,
    ou: 0,
    ee: 0,
    oh: 0,
  };

  const head = vrm.humanoid?.getNormalizedBoneNode('head') ?? null;
  if (!head) console.warn('[vrmRig] no humanoid head bone.');

  const mixer = new AnimationMixer(vrm.scene);

  const emotionWeights: Record<EmotionName, number> = {
    neutral: 1,
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    relaxed: 0,
  };

  return {
    scene: vrm.scene,
    applyMouthVisemes(visemeWeights, volumeGain, delta) {
      const em = vrm.expressionManager;
      if (!em) return;

      for (const k of VRM_MOUTH_EXPRESSIONS) targetBuf[k] = 0;
      if (visemeWeights) {
        for (const v of VISEMES) {
          const w = visemeWeights.get(v);
          if (!w) continue;
          const mapping = VISEME_TO_VRM[v];
          for (const expr of VRM_MOUTH_EXPRESSIONS) {
            const m = mapping[expr];
            if (!m) continue;
            targetBuf[expr] += w * m;
          }
        }
      }

      for (const expr of VRM_MOUTH_EXPRESSIONS) {
        const target = targetBuf[expr] * volumeGain;
        smoothed[expr] = MathUtils.damp(smoothed[expr], target, DAMP_LAMBDA, delta);
        em.setValue(expr, smoothed[expr]);
      }
    },
    applyBlink(weight) {
      vrm.expressionManager?.setValue(BLINK_EXPRESSION, weight);
    },
    applyEmotion(active, delta) {
      const em = vrm.expressionManager;
      if (!em) return;
      for (const k of EMOTIONS) {
        emotionWeights[k] = MathUtils.damp(
          emotionWeights[k],
          k === active ? 1 : 0,
          EMOTION_LAMBDA,
          delta,
        );
        const preset = VRM_EMOTION_PRESETS[k];
        if (preset) em.setValue(preset, emotionWeights[k]);
      }
    },
    getHeadBone() {
      return head;
    },
    retargetMixamoClip(asset: Group): AnimationClip {
      const sourceClip =
        AnimationClip.findByName(asset.animations, 'mixamo.com') ?? asset.animations[0];
      if (!sourceClip) throw new Error('[vrmRig] FBX has no animation tracks');

      const tracks: KeyframeTrack[] = [];
      const restRotationInverse = new Quaternion();
      const parentRestWorldRotation = new Quaternion();
      const _q = new Quaternion();
      const _v = new Vector3();

      const motionHips = asset.getObjectByName('mixamorigHips');
      if (!motionHips) throw new Error('[vrmRig] FBX missing mixamorigHips');
      const motionHipsHeight = motionHips.position.y;

      const vrmHipsBone = vrm.humanoid?.getNormalizedBoneNode('hips');
      if (!vrmHipsBone) throw new Error('[vrmRig] VRM missing hips bone');
      const vrmHipsY = vrmHipsBone.getWorldPosition(_v).y;
      const vrmRootY = vrm.scene.getWorldPosition(_v).y;
      const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
      const hipsScale = vrmHipsHeight / motionHipsHeight;
      const isVRM0 = vrm.meta?.metaVersion === '0';

      let dropped = 0;
      for (const track of sourceClip.tracks) {
        const dot = track.name.indexOf('.');
        if (dot < 0) continue;
        const mixamoName = track.name.slice(0, dot);
        const property = track.name.slice(dot + 1);

        const vrmBoneKey = mixamoVRMRigMap[mixamoName];
        if (!vrmBoneKey) continue;
        if (VRM_RESERVED_BONES.has(vrmBoneKey)) {
          dropped += 1;
          continue;
        }

        const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneKey as VRMHumanBoneName);
        if (!vrmNode) continue;
        const mixamoNode = asset.getObjectByName(mixamoName);
        if (!mixamoNode || !mixamoNode.parent) continue;

        mixamoNode.getWorldQuaternion(restRotationInverse).invert();
        mixamoNode.parent.getWorldQuaternion(parentRestWorldRotation);

        if (track instanceof QuaternionKeyframeTrack) {
          const values = Float32Array.from(track.values);
          for (let i = 0; i < values.length; i += 4) {
            _q.fromArray(values, i);
            _q.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
            _q.toArray(values, i);
          }
          if (isVRM0) {
            for (let i = 0; i < values.length; i += 4) {
              values[i] = -values[i];
              values[i + 2] = -values[i + 2];
            }
          }
          tracks.push(
            new QuaternionKeyframeTrack(`${vrmNode.name}.${property}`, Array.from(track.times), Array.from(values)),
          );
        } else if (track instanceof VectorKeyframeTrack) {
          const values = Float32Array.from(track.values);
          if (isVRM0) {
            for (let i = 0; i < values.length; i += 3) {
              values[i] = -values[i];
              values[i + 2] = -values[i + 2];
            }
          }
          for (let i = 0; i < values.length; i += 1) values[i] *= hipsScale;
          tracks.push(
            new VectorKeyframeTrack(`${vrmNode.name}.${property}`, Array.from(track.times), Array.from(values)),
          );
        }
      }

      if (tracks.length === 0) {
        throw new Error('[vrmRig] no Mixamo tracks matched the VRM humanoid');
      }
      console.log(`[vrmRig] retargeted ${tracks.length} tracks (${dropped} reserved-bone tracks dropped)`);
      return new AnimationClip(sourceClip.name, sourceClip.duration, tracks);
    },
    playClip(clip) {
      const action = mixer.clipAction(clip);
      action.play();
      return action;
    },
    tick(delta) {
      mixer.update(delta);
      vrm.update(delta);
    },
  };
}
