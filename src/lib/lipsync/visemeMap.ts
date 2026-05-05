/**
 * Centralised viseme + expression names.
 * Swapping a model? Edit this file ONLY.
 *
 * Target: VRM 1.0 avatars driven via VRMExpressionManager. VRM exposes
 * 5 mouth presets (aa, ih, ou, ee, oh) plus `blink`. TalkingHead's
 * lipsync-en produces 15 ARKit-style visemes — we collapse them onto
 * the VRM 5 with weights.
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

export const BLINK_EXPRESSION = 'blink' as const;
