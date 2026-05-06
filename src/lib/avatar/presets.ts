import { AVATAR_URL } from '@/lib/config';

export interface AvatarPreset {
  id: string;
  label: string;
  url: string;
}

const VRM_SAMPLE =
  'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'vrm-sample', label: 'VRM — pixiv sample', url: VRM_SAMPLE },
  { id: 'local-glb', label: 'GLB — local /models/projectPeter.glb', url: '/models/projectPeter.glb' },
];

/** Initial selection: whatever VITE_AVATAR_URL points at. Falls back to first preset. */
export const DEFAULT_AVATAR_URL =
  AVATAR_PRESETS.find((p) => p.url === AVATAR_URL)?.url ?? AVATAR_URL ?? AVATAR_PRESETS[0].url;
