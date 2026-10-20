import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const source = resolve(root, 'tools/asset-pipeline/A IMPLEMENTAR')
const out = resolve(root, 'apps/web/public/images/brands')

const files = {
  'nvidia.webp': 'Nvidia-Logo-PNG-Image-Transparent.png',
  'radeon.webp': 'AMD_Radeon_graphics_logo_2014.png',
  'arc.webp': 'badge-arc-graphics_1080-1080.avif',
  'ryzen.webp': 'a8cc694774d5428747c9e7c92bed2504.jpg',
  'intel.webp': 'intel-brand-logo-symbol-white-design-software-computer-illustration-with-blue-background-free-vector.jpg',
  'amd.webp': 'amd-logo-png_seeklogo-175858.png',
}

mkdirSync(out, { recursive: true })

for (const [dest, file] of Object.entries(files)) {
  await sharp(resolve(source, file))
    .trim({ threshold: 18 })
    .resize({ height: 512, width: 512, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(resolve(out, dest))
  console.log(dest)
}
