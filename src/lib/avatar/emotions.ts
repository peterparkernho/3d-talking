/**
 * Emotion taxonomy + per-format mappings. Keep this list aligned with
 * VRM expression presets so the VRM rig is a 1:1 lookup.
 */

export const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'relaxed'] as const;
export type EmotionName = (typeof EMOTIONS)[number];

/**
 * VRM 1.0 preset names per emotion. `null` means no expression to drive
 * (neutral is implicit when all others are 0).
 */
export const VRM_EMOTION_PRESETS: Record<EmotionName, string | null> = {
  neutral: null,
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  surprised: 'surprised',
  relaxed: 'relaxed',
};

/**
 * GLB / RPM (ARKit) composition: each emotion is a weighted sum of ARKit
 * blendshape morph targets. Weights are absolute (0..1) at full emotion.
 * Shapes that overlap with `eyeBlink*` (blink) or `viseme_*` (lipsync) are
 * intentionally avoided so the systems don't fight.
 */
export const ARKIT_EMOTION_COMPOSITION: Record<EmotionName, Record<string, number>> = {
  neutral: {},
  happy: {
    mouthSmileLeft: 0.85,
    mouthSmileRight: 0.85,
    cheekSquintLeft: 0.4,
    cheekSquintRight: 0.4,
    eyeSquintLeft: 0.25,
    eyeSquintRight: 0.25,
  },
  sad: {
    mouthFrownLeft: 0.7,
    mouthFrownRight: 0.7,
    browDownLeft: 0.3,
    browDownRight: 0.3,
    browInnerUp: 0.4,
    mouthLowerDownLeft: 0.2,
    mouthLowerDownRight: 0.2,
  },
  angry: {
    browDownLeft: 0.85,
    browDownRight: 0.85,
    mouthPressLeft: 0.45,
    mouthPressRight: 0.45,
    noseSneerLeft: 0.35,
    noseSneerRight: 0.35,
    jawForward: 0.2,
  },
  surprised: {
    browInnerUp: 0.85,
    browOuterUpLeft: 0.7,
    browOuterUpRight: 0.7,
    eyeWideLeft: 0.6,
    eyeWideRight: 0.6,
    jawOpen: 0.25,
    mouthFunnel: 0.2,
  },
  relaxed: {
    mouthSmileLeft: 0.3,
    mouthSmileRight: 0.3,
    cheekSquintLeft: 0.15,
    cheekSquintRight: 0.15,
  },
};

/** All ARKit shape names referenced by any emotion — used to build the per-mesh index. */
export const ARKIT_EMOTION_SHAPES: readonly string[] = Array.from(
  new Set(
    EMOTIONS.flatMap((e) => Object.keys(ARKIT_EMOTION_COMPOSITION[e])),
  ),
);
