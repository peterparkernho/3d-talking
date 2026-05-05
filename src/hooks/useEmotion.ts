import { useFrame } from '@react-three/fiber';
import type { AvatarRig } from '@/lib/avatar/rig';
import type { EmotionName } from '@/lib/avatar/emotions';

export function useEmotion(rig: AvatarRig | null, active: EmotionName) {
  useFrame((_, delta) => {
    if (!rig) return;
    rig.applyEmotion(active, delta);
  });
}
