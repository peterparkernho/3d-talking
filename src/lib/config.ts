/**
 * Single source of truth for tunable runtime config.
 * Avatar URL is overridable via VITE_AVATAR_URL.
 */

// Default is the pixiv/three-vrm VRM 1.0 sample (MIT-licensed) served via
// jsDelivr — no auth, no signup, suitable for local dev. Override with
// VITE_AVATAR_URL to point at your own VRM file or CDN URL.
const DEFAULT_AVATAR_URL =
  'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';

export const AVATAR_URL: string =
  (import.meta.env.VITE_AVATAR_URL as string | undefined) ?? DEFAULT_AVATAR_URL;

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL as string | undefined;
export const LIVEKIT_TOKEN = import.meta.env.VITE_LIVEKIT_TOKEN as string | undefined;

/**
 * Mixamo body animations. Drop the FBX files into /public/animations/ and
 * the avatar plays idle by default, crossfading to talking while audio is
 * playing. Override either path with VITE_IDLE_ANIM_URL / VITE_TALKING_ANIM_URL.
 * Missing files log a warning and the avatar still works without body motion.
 */
export const IDLE_ANIM_URL: string =
  (import.meta.env.VITE_IDLE_ANIM_URL as string | undefined) ?? '/animations/idle.fbx';
export const TALKING_ANIM_URL: string =
  (import.meta.env.VITE_TALKING_ANIM_URL as string | undefined) ?? '/animations/talking.fbx';
