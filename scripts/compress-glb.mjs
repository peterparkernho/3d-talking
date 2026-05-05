#!/usr/bin/env node
/**
 * Compress a GLB with Draco geometry + texture resize/quantization.
 *
 * Usage:
 *   pnpm compress:glb path/to/in.glb [out.glb]
 *
 * Per project rules, do not commit the resulting file.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, draco, prune, resample, textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const [, , inPath, outPathArg] = process.argv;
if (!inPath) {
  console.error('Usage: pnpm compress:glb <in.glb> [out.glb]');
  process.exit(1);
}
const outPath = outPathArg ?? inPath.replace(/\.glb$/, '.compressed.glb');

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

const doc = await io.read(inPath);
await doc.transform(
  prune(),
  dedup(),
  resample(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }),
  draco(),
);
await io.write(outPath, doc);

console.log('Wrote', outPath);
