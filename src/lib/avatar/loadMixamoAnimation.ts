import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { AvatarRig } from './rig';

/**
 * Load a Mixamo FBX and retarget it for the given rig. Throws if the asset
 * has no animation track. The rig decides how to map Mixamo bones onto its
 * own skeleton — VRM does full rest-pose retargeting, GLB strips the
 * `mixamorig` prefix.
 */
export async function loadMixamoAnimation(
  url: string,
  rig: AvatarRig,
): Promise<THREE.AnimationClip> {
  const loader = new FBXLoader();
  const asset = await loader.loadAsync(url);
  return rig.retargetMixamoClip(asset);
}
