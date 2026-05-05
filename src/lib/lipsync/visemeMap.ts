/**
 * Centralised viseme + expression names. Edit ONLY this file when
 * adding/swapping avatar formats.
 *
 * Two paths are supported:
 *  - GLB / RPM avatars: 15 ARKit-style `viseme_*` morph targets driven by
 *    morphTargetInfluences directly, plus `eyeBlinkLeft/Right` for blinks.
 *  - VRM 1.0 avatars: 5 mouth expression presets (aa, ih, ou, ee, oh) plus
 *    `blink`, driven via VRMExpressionManager. TalkingHead's `lipsync-en`
 *    produces the 15 ARKit visemes; we collapse them onto the 5 with
 *    weighted contributions.
 */

export const VISEMES = [
  'viseme_sil',
  'viseme_PP',
  'viseme_FF',
  'viseme_TH',
  'viseme_DD',
  'viseme_kk',
  'viseme_CH',
  'viseme_SS',
  'viseme_nn',
  'viseme_RR',
  'viseme_aa',
  'viseme_E',
  'viseme_I',
  'viseme_O',
  'viseme_U',
] as const;

export type VisemeKey = (typeof VISEMES)[number];

export const VRM_MOUTH_EXPRESSIONS = ['aa', 'ih', 'ou', 'ee', 'oh'] as const;
export type VrmMouthExpression = (typeof VRM_MOUTH_EXPRESSIONS)[number];

/**
 * 15 ARKit visemes → VRM's 5 mouth presets. Weights sum to ≤1 per row.
 * Vowels map 1:1; consonants split between a closed (ih) and open (aa)
 * shape so the mouth still articulates without overshooting.
 */
export const VISEME_TO_VRM: Record<VisemeKey, Partial<Record<VrmMouthExpression, number>>> = {
  viseme_sil: {},
  viseme_aa: { aa: 1 },
  viseme_E: { ee: 1 },
  viseme_I: { ih: 1 },
  viseme_O: { oh: 1 },
  viseme_U: { ou: 1 },
  viseme_PP: { ih: 0.4 },
  viseme_FF: { ih: 0.5 },
  viseme_TH: { ee: 0.4, ih: 0.3 },
  viseme_DD: { ee: 0.5 },
  viseme_kk: { aa: 0.5 },
  viseme_CH: { ee: 0.6 },
  viseme_SS: { ee: 0.5 },
  viseme_nn: { ih: 0.5 },
  viseme_RR: { oh: 0.5 },
};

/** GLB / RPM blink morph target names. */
export const BLINK_KEYS_GLB = ['eyeBlinkLeft', 'eyeBlinkRight'] as const;

/** VRM blink expression preset name. */
export const BLINK_EXPRESSION = 'blink' as const;
