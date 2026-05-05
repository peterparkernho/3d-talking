import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createDemoTransport, type MessageTransport } from '@/lib/transport';
import { buildVisemeTimeline, type ScheduledViseme } from '@/lib/lipsync/visemeTimeline';

function pickTransport(): { transport: MessageTransport; mode: 'rest' | 'ws' | 'demo' } {
  // Swap createDemoTransport() for createRestTransport(url) or
  // createWsTransport(url) when wiring a real backend.
  return { transport: createDemoTransport(), mode: 'demo' };
}

export interface UseAgent {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  text: string;
  timeline: ScheduledViseme[];
  isPlaying: boolean;
  isSending: boolean;
  isMuted: boolean;
  mode: 'rest' | 'ws' | 'demo';
  send: (userText: string) => Promise<void>;
  toggleMute: () => void;
  stop: () => void;
}

export function useAgent(): UseAgent {
  const { transport, mode } = useMemo(pickTransport, []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [text, setText] = useState('');
  const [timeline, setTimeline] = useState<ScheduledViseme[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.preload = 'auto';
    audioRef.current = el;
    const onPlay = () => setIsPlaying(true);
    const onPauseOrEnd = () => setIsPlaying(false);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPauseOrEnd);
    el.addEventListener('ended', onPauseOrEnd);
    return () => {
      el.pause();
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPauseOrEnd);
      el.removeEventListener('ended', onPauseOrEnd);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      audioRef.current = null;
      transport.dispose?.();
    };
  }, [transport]);

  const send = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed) return;
      setIsSending(true);
      try {
        const response = await transport.send(trimmed);
        const blob = new Blob([response.audio], { type: response.mimeType });
        const url = URL.createObjectURL(blob);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;

        const el = audioRef.current;
        if (!el) return;
        el.src = url;
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            el.removeEventListener('loadedmetadata', onReady);
            el.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            el.removeEventListener('loadedmetadata', onReady);
            el.removeEventListener('error', onError);
            reject(new Error('audio load failed'));
          };
          el.addEventListener('loadedmetadata', onReady);
          el.addEventListener('error', onError);
        });

        const next = buildVisemeTimeline(response.text, el.duration);
        setText(response.text);
        setTimeline(next);
        await el.play();
      } finally {
        setIsSending(false);
      }
    },
    [transport],
  );

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  return {
    audioRef,
    text,
    timeline,
    isPlaying,
    isSending,
    isMuted,
    mode,
    send,
    toggleMute,
    stop,
  };
}
