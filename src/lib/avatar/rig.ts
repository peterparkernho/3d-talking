import type { Object3D } from 'three';
import type { VisemeKey } from '@/lib/lipsync/visemeMap';

/**
 * Format-agnostic handle for a loaded character. Hooks talk to this — they
 * never branch on whether the underlying asset is a GLB or a VRM.
 *
 * Each rig owns its own damped state for mouth/blink so the hooks are
 * stateless aside from inputs they own (timing, audio analyser).
 */
export interface AvatarRig {
  readonly scene: Object3D;

  /**
   * Drive mouth shapes from the lipsync timeline. Pass `null` to ramp the
   * mouth back to closed. `volumeGain` 0..1 scales overall mouth amplitude.
   */
  applyMouthVisemes(
    visemeWeights: ReadonlyMap<VisemeKey, number> | null,
    volumeGain: number,
    delta: number,
  ): void;

  /** Set blink weight 0..1 directly (callers handle their own easing). */
  applyBlink(weight: number): void;

  /** Head bone for cursor tracking. Returns null if humanoid mapping is unavailable. */
  getHeadBone(): Object3D | null;

  /**
   * Per-frame tick. VRM uses this for `vrm.update(delta)` (spring bones,
   * expression flush). GLB rigs typically noop. MUST be called AFTER any
   * `applyMouthVisemes` / `applyBlink` calls in the same frame.
   */
  tick(delta: number): void;
}
