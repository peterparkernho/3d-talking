import { useCallback, useEffect, useRef, useState } from 'react';
import { connectLipsyncTo, resumeLipsyncContext } from '@/lib/lipsync/lipsync';

export interface UseAudio {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isReady: boolean;
  isMuted: boolean;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  toggleMute: () => void;
}

export function useAudio(src: string): UseAudio {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const el = new Audio(src);
    el.crossOrigin = 'anonymous';
    el.preload = 'auto';
    el.loop = true;
    audioRef.current = el;

    const onPlay = () => setIsPlaying(true);
    const onPauseOrEnd = () => setIsPlaying(false);
    const onCanPlay = () => setIsReady(true);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPauseOrEnd);
    el.addEventListener('ended', onPauseOrEnd);
    el.addEventListener('canplay', onCanPlay);

    return () => {
      el.pause();
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPauseOrEnd);
      el.removeEventListener('ended', onPauseOrEnd);
      el.removeEventListener('canplay', onCanPlay);
      audioRef.current = null;
    };
  }, [src]);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    await resumeLipsyncContext();
    connectLipsyncTo(el);
    await el.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void play();
    else pause();
  }, [play, pause]);

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }, []);

  return { audioRef, isPlaying, isReady, isMuted, play, pause, toggle, toggleMute };
}
