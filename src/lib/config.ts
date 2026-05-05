/**
 * Single source of truth for tunable runtime config.
 * Avatar URL is overridable via VITE_AVATAR_URL.
 */

// Bundled in /public/models/ (gitignored). Sourced from wawa-lipsync's demo —
// an RPM avatar with ARKit + Oculus visemes baked in. Override with
// VITE_AVATAR_URL to point at your own RPM URL or a different local file.
const DEFAULT_AVATAR_URL = '/models/character.glb';

export const AVATAR_URL: string =
  (import.meta.env.VITE_AVATAR_URL as string | undefined) ?? DEFAULT_AVATAR_URL;

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL as string | undefined;
export const LIVEKIT_TOKEN = import.meta.env.VITE_LIVEKIT_TOKEN as string | undefined;
