import { MathUtils } from 'three';
import type { VRM } from '@pixiv/three-vrm';
import {
  BLINK_EXPRESSION,
  VISEMES,
  VISEME_TO_VRM,
  VRM_MOUTH_EXPRESSIONS,
  type VrmMouthExpression,
} from '@/lib/lipsync/visemeMap';
import type { AvatarRig } from './rig';

const DAMP_LAMBDA = 18;

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
    getHeadBone() {
      return head;
    },
    tick(delta) {
      vrm.update(delta);
    },
  };
}
