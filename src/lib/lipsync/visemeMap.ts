/**
 * Centralised viseme + expression blendshape names.
 * Swapping a model? Edit this file ONLY.
 *
 * Defaults match Ready Player Me + Oculus visemes (loaded with
 * `?morphTargets=ARKit,Oculus+Visemes`). RPM also exposes ARKit
 * shapes like eyeBlinkLeft / eyeBlinkRight used by the blink loop.
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

export const BLINK_KEYS = ['eyeBlinkLeft', 'eyeBlinkRight'] as const;
