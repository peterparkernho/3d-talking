import { LipsyncEn } from '@met4citizen/talkinghead/modules/lipsync-en.mjs';
import { VISEMES, type VisemeKey } from '@/lib/lipsync/visemeMap';

const ENGINE = new LipsyncEn();

export interface ScheduledViseme {
  /** RPM viseme key e.g. 'viseme_aa' */
  key: VisemeKey;
  /** seconds into audio when this viseme starts */
  start: number;
  /** seconds into audio when this viseme ends */
  end: number;
}

const VISEME_KEY_SET = new Set<string>(VISEMES);

function toRpmKey(raw: string): VisemeKey | null {
  const candidate = `viseme_${raw}` as VisemeKey;
  return VISEME_KEY_SET.has(candidate) ? candidate : null;
}

/**
 * Build a viseme timeline from the response text and align it to the audio
 * duration via linear stretch. With audioDuration in seconds.
 */
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
 * Linear search for the active viseme at time t. Cheap given typical
 * timeline sizes (~hundreds of entries per minute of speech).
 */
export function findActiveViseme(timeline: ScheduledViseme[], t: number): VisemeKey | null {
  for (let i = 0; i < timeline.length; i += 1) {
    const v = timeline[i];
    if (t >= v.start && t < v.end) return v.key;
    if (v.start > t) return null;
  }
  return null;
}
