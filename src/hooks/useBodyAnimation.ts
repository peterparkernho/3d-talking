import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type AnimationAction } from 'three';
import { loadMixamoAnimation } from '@/lib/avatar/loadMixamoAnimation';
import type { AvatarRig } from '@/lib/avatar/rig';

const CROSSFADE_LAMBDA = 4;

/**
 * Loads two Mixamo FBX clips (idle + talking), plays them on the rig's
 * mixer, and crossfades between them based on `isPlaying`. Failures to
 * load (e.g. missing files in /public/animations) are logged and the
 * avatar runs without body motion.
 */
export function useBodyAnimation(
  rig: AvatarRig | null,
  idleUrl: string | undefined,
  talkingUrl: string | undefined,
  isPlaying: boolean,
) {
  const idleRef = useRef<AnimationAction | null>(null);
  const talkRef = useRef<AnimationAction | null>(null);

  useEffect(() => {
    if (!rig) return;
    let cancelled = false;

    async function loadInto(
      url: string | undefined,
      target: typeof idleRef,
      label: string,
      initialWeight: number,
    ) {
      if (!url || !rig) return;
      try {
        const clip = await loadMixamoAnimation(url, rig);
        if (cancelled) return;
        const action = rig.playClip(clip);
        action.setEffectiveWeight(initialWeight);
        target.current = action;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[useBodyAnimation] ${label} animation skipped:`, msg);
      }
    }

    void loadInto(idleUrl, idleRef, 'idle', 1);
    void loadInto(talkingUrl, talkRef, 'talking', 0);

    return () => {
      cancelled = true;
      idleRef.current?.stop();
      talkRef.current?.stop();
      idleRef.current = null;
      talkRef.current = null;
    };
  }, [rig, idleUrl, talkingUrl]);

  useFrame((_, delta) => {
    const idle = idleRef.current;
    const talk = talkRef.current;
    if (!idle && !talk) return;
    const target = isPlaying ? 1 : 0;
    if (idle && talk) {
      const w = MathUtils.damp(talk.getEffectiveWeight(), target, CROSSFADE_LAMBDA, delta);
      talk.setEffectiveWeight(w);
      idle.setEffectiveWeight(1 - w);
    } else if (idle) {
      // Only idle loaded — keep it at full weight.
      idle.setEffectiveWeight(1);
    } else if (talk) {
      // Only talking loaded — fade in/out solo.
      const w = MathUtils.damp(talk.getEffectiveWeight(), target, CROSSFADE_LAMBDA, delta);
      talk.setEffectiveWeight(w);
    }
  });
}
