import { Lipsync } from 'wawa-lipsync';

/**
 * One Lipsync instance per page. Holds an AudioContext + AnalyserNode
 * (fftSize 1024). createMediaElementSource throws if called twice for
 * the same element/context, so connections are tracked here.
 */

let instance: Lipsync | null = null;
let connectedTo: HTMLMediaElement | null = null;

export function getLipsync(): Lipsync {
  if (!instance) instance = new Lipsync({ fftSize: 2048, historySize: 10 });
  return instance;
}

export function connectLipsyncTo(el: HTMLMediaElement): Lipsync {
  const ls = getLipsync();
  if (connectedTo === el) return ls;
  if (connectedTo) {
    console.warn('[lipsync] connecting to a new element; previous source still routed.');
  }
  ls.connectAudio(el);
  connectedTo = el;
  return ls;
}

export async function resumeLipsyncContext(): Promise<void> {
  const ctx = (getLipsync() as unknown as { audioContext: AudioContext }).audioContext;
  if (ctx.state === 'suspended') await ctx.resume();
}
