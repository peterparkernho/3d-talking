import { LipsyncEn } from '@met4citizen/talkinghead/modules/lipsync-en.mjs';
import { VISEMES, type VisemeKey } from '@/lib/lipsync/visemeMap';

const ENGINE = new LipsyncEn();

/** Cross-fade window between adjacent visemes (seconds). */
export const BLEND_SEC = 0.07;

export interface ScheduledViseme {
  key: VisemeKey;
  start: number;
  end: number;
}

const VISEME_KEY_SET = new Set<string>(VISEMES);

function toRpmKey(raw: string): VisemeKey | null {
  const candidate = `viseme_${raw}` as VisemeKey;
  return VISEME_KEY_SET.has(candidate) ? candidate : null;
}

export function buildVisemeTimeline(text: string, audioDuration: number): ScheduledViseme[] {
  const cleaned = ENGINE.preProcessText(text);
  if (!cleaned) return [];
  const { visemes, times, durations } = ENGINE.wordsToVisemes(cleaned);
  if (!visemes.length) return [];

  const lastEnd = times[times.length - 1] + durations[durations.length - 1];
  if (lastEnd <= 0 || !Number.isFinite(audioDuration) || audioDuration <= 0) return [];

  const scale = audioDuration / lastEnd;
  const scheduled: ScheduledViseme[] = [];
  for (let i = 0; i < visemes.length; i += 1) {
    const key = toRpmKey(visemes[i]);
    if (!key) continue;
    scheduled.push({
      key,
      start: times[i] * scale,
      end: (times[i] + durations[i]) * scale,
    });
  }
  return scheduled;
}

/**
 * Trapezoidal blending: each viseme has ramp-up over BLEND_SEC,
 * a hold at weight 1, then ramp-down. Adjacent visemes overlap
 * during their ramps, so the mouth morphs continuously between
 * shapes (coarticulation) instead of snapping to one at a time.
 *
 * We mutate `out` in place to avoid GC churn each frame.
 */
export function computeVisemeWeights(
  timeline: ScheduledViseme[],
  t: number,
  out: Map<VisemeKey, number>,
): Map<VisemeKey, number> {
  out.clear();
  const half = BLEND_SEC / 2;

  for (const v of timeline) {
    if (t < v.start - half) break;
    if (t > v.end + half) continue;

    let w: number;
    if (t < v.start + half) {
      w = (t - (v.start - half)) / BLEND_SEC;
    } else if (t > v.end - half) {
      w = (v.end + half - t) / BLEND_SEC;
    } else {
      w = 1;
    }
    if (w <= 0) continue;
    const prev = out.get(v.key);
    if (prev === undefined || w > prev) out.set(v.key, w);
  }
  return out;
}
