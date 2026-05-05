/**
 * Lazy AudioContext + AnalyserNode tapped onto an HTMLAudioElement.
 * Used to drive volume modulation on the lipsync.
 *
 * createMediaElementSource can only be called once per element + context,
 * so we cache by element identity.
 */

let ctx: AudioContext | null = null;
const tapped = new WeakMap<HTMLMediaElement, AnalyserNode>();

function getContext(): AudioContext {
  if (!ctx) {
    type Ctor = typeof AudioContext;
    type WithWebkit = typeof window & { webkitAudioContext?: Ctor };
    const Ctor = (window.AudioContext ?? (window as WithWebkit).webkitAudioContext) as Ctor;
    ctx = new Ctor();
  }
  return ctx;
}

export function attachAnalyser(el: HTMLMediaElement): AnalyserNode {
  const cached = tapped.get(el);
  if (cached) return cached;
  const c = getContext();
  const source = c.createMediaElementSource(el);
  const analyser = c.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.5;
  source.connect(analyser);
  analyser.connect(c.destination);
  tapped.set(el, analyser);
  return analyser;
}

export async function resumeAudioContext(): Promise<void> {
  const c = getContext();
  if (c.state === 'suspended') await c.resume();
}

const buf = new Uint8Array(1024);

/**
 * Returns RMS volume in 0..1 from time-domain samples.
 */
export function readVolume(analyser: AnalyserNode): number {
  const len = Math.min(buf.length, analyser.fftSize);
  analyser.getByteTimeDomainData(buf.subarray(0, len));
  let sumSq = 0;
  for (let i = 0; i < len; i += 1) {
    const v = (buf[i] - 128) / 128;
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / len);
}
