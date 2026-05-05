import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import { createGlbRig } from './glbRig';
import { createVrmRig } from './vrmRig';
import type { AvatarRig } from './rig';

export type AvatarKind = 'vrm' | 'glb';

export function detectAvatarKind(url: string): AvatarKind {
  // Strip query/hash before sniffing.
  const path = url.split(/[?#]/, 1)[0].toLowerCase();
  return path.endsWith('.vrm') ? 'vrm' : 'glb';
}

/**
 * Load a character into a format-agnostic AvatarRig. The loader is the only
 * place that knows about three-vrm or GLTF specifics — downstream hooks
 * never branch on file format.
 */
export async function loadAvatar(url: string): Promise<AvatarRig> {
  const kind = detectAvatarKind(url);
  const loader = new GLTFLoader();
  if (kind === 'vrm') {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  }

  const gltf = await loader.loadAsync(url);

  if (kind === 'vrm') {
    const vrm = gltf.userData.vrm as VRM | undefined;
    if (!vrm) {
      throw new Error(`[loadAvatar] expected VRM data on ${url} but none was attached.`);
    }
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);
    if (vrm.meta?.metaVersion === '0') VRMUtils.rotateVRM0(vrm);
    return createVrmRig(vrm);
  }

  return createGlbRig(gltf.scene);
}

/**
 * Suspense-compatible reader. First call throws a Promise, subsequent calls
 * return the resolved AvatarRig. Errors are re-thrown so the parent error
 * boundary (or React's default) can surface them.
 */
const cache = new Map<string, Promise<AvatarRig> | AvatarRig | Error>();

export function readAvatar(url: string): AvatarRig {
  const entry = cache.get(url);
  if (entry instanceof Error) throw entry;
  if (entry && !(entry instanceof Promise)) return entry;
  if (entry instanceof Promise) throw entry;

  const promise = loadAvatar(url).then(
    (rig) => {
      cache.set(url, rig);
      return rig;
    },
    (err: unknown) => {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      cache.set(url, wrapped);
      throw wrapped;
    },
  );
  cache.set(url, promise);
  throw promise;
}
