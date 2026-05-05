import type { AnimationAction, AnimationClip, Group, Object3D } from 'three';
import type { VisemeKey } from '@/lib/lipsync/visemeMap';

/**
 * Format-agnostic handle for a loaded character. Hooks talk to this — they
 * never branch on whether the underlying asset is a GLB or a VRM.
 *
 * Each rig owns its own damped state for mouth/blink and its own
 * AnimationMixer for body clips, so the React-side hooks stay stateless.
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
   * Adapt a Mixamo FBX asset (loaded as a Group) to this rig's skeleton.
   * Tracks targeting bones reserved for other systems (head, neck) are
   * dropped so the body animation can't fight head tracking or lipsync.
   */
  retargetMixamoClip(asset: Group): AnimationClip;

  /**
   * Schedule a clip on the rig's AnimationMixer. Returns the action so the
   * caller can crossfade. The mixer is advanced inside `tick(delta)`.
   */
  playClip(clip: AnimationClip): AnimationAction;

  /**
   * Per-frame tick. Advances the AnimationMixer, then runs format-specific
   * post-step (VRM expression flush + spring bones; noop for plain GLB).
   * MUST be called AFTER `applyMouthVisemes` / `applyBlink` so expression
   * weights flush correctly. Should also run AFTER head tracking writes
   * so the body animation's head tracks (already filtered, but defensive)
   * never override the cursor-driven rotation.
   */
  tick(delta: number): void;
}
