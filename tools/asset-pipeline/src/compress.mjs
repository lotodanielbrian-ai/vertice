import { Document, NodeIO } from '@gltf-transform/core'
import { KHRDracoMeshCompression, KHRTextureBasisu } from '@gltf-transform/extensions'
import { draco } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createDefaultContainer, VK_FORMAT_R8G8B8A8_UNORM, write as writeKtx } from 'ktx-parse'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const outDir = resolve(root, 'apps/web/public/models')
const slug = process.argv[2] ?? 'g_5090'
const lod = 'lod_2_low'
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function uncompressedKtx2() {
  const container = createDefaultContainer()
  container.vkFormat = VK_FORMAT_R8G8B8A8_UNORM
  container.typeSize = 4
  container.pixelWidth = 1
  container.pixelHeight = 1
  container.levelCount = 1
  const levelData = new Uint8Array([0, 240, 255, 255])
  container.levels = [{ levelData, uncompressedByteLength: levelData.byteLength }]
  return Buffer.from(writeKtx(container))
}

function boxDocument() {
  const document = new Document()
  const buffer = document.createBuffer()
  const positions = document
    .createAccessor()
    .setBuffer(buffer)
    .setType('VEC3')
    .setArray(
      new Float32Array([
        -1, -0.2, -0.4, 1, -0.2, -0.4, 1, 0.35, -0.4, -1, 0.35, -0.4,
        -1, -0.2, 0.4, 1, -0.2, 0.4, 1, 0.35, 0.4, -1, 0.35, 0.4,
      ]),
    )
  const indices = document
    .createAccessor()
    .setBuffer(buffer)
    .setType('SCALAR')
    .setArray(
      new Uint16Array([
        0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
      ]),
    )
  const texture = document.createTexture('accent').setImage(PNG).setMimeType('image/png')
  const material = document.createMaterial('shroud').setBaseColorTexture(texture).setMetallicFactor(0.4)
  const primitive = document
    .createPrimitive()
    .setAttribute('POSITION', positions)
    .setIndices(indices)
    .setMaterial(material)
  const mesh = document.createMesh('gpu-lod2').addPrimitive(primitive)
  document.createScene().addChild(document.createNode('shroud').setMesh(mesh))
  return document
}

const io = new NodeIO().registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
}).registerExtensions([KHRDracoMeshCompression, KHRTextureBasisu])

const document = boxDocument()
await document.transform(draco())

const textureUrl = `/models/${slug}.${lod}.ktx2`
const ktxPath = resolve(outDir, `${slug}.${lod}.ktx2`)
mkdirSync(outDir, { recursive: true })
const pngPath = resolve(outDir, `${slug}.source.png`)
writeFileSync(pngPath, PNG)

let ktxMode = 'ktx2-uncompressed'
try {
  execFileSync('toktx', ['--t2', '--encode', 'etc1s', '--genmipmap', ktxPath, pngPath], { stdio: 'pipe' })
  ktxMode = 'basis-etc1s'
  console.log('Textura Basis ETC1S escrita con toktx')
} catch {
  writeFileSync(ktxPath, uncompressedKtx2())
  console.warn('toktx no está instalado: se escribió un KTX2 RGBA sin comprimir. Basis/UASTC requiere el binario toktx.')
}

mkdirSync(outDir, { recursive: true })
const filePath = resolve(outDir, `${slug}.${lod}.glb`)
await io.write(filePath, document)
const bytes = (await import('node:fs')).statSync(filePath).size
const polygons = 12

const manifest = [
  {
    slug,
    lod,
    url: `/models/${slug}.${lod}.glb`,
    bytes,
    polygons,
    draco: true,
    textureUrl,
  },
]
writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`GLB Draco escrito en ${filePath} (${bytes} bytes, ${polygons} triángulos, textura ${ktxMode})`)

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://pcbuilder:pcbuilder@localhost:5432/pcbuilder'
const sql = postgres(databaseUrl, { max: 1, connect_timeout: 5 })
try {
  const [component] = await sql`select id from components where slug = ${slug}`
  if (!component) {
    console.warn(`El slug ${slug} todavía no está en la base. El seed tomará manifest.json.`)
  } else {
    const bbox = JSON.stringify({ x: 340, y: 140, z: 50 })
    await sql`
      insert into component_assets_3d (
        component_id, lod_level, file_format, mesh_storage_url, draco_compressed,
        file_size_bytes, polygon_count, texture_basis_ktx2_url, bounding_box_dimensions_mm
      ) values (
        ${component.id}, ${lod}::lod_level_enum, 'glb', ${manifest[0].url}, true,
        ${bytes}, ${polygons}, ${textureUrl}, ${bbox}::jsonb
      )
      on conflict (component_id, lod_level) do update set
        mesh_storage_url = excluded.mesh_storage_url,
        draco_compressed = true,
        file_size_bytes = excluded.file_size_bytes,
        polygon_count = excluded.polygon_count,
        texture_basis_ktx2_url = excluded.texture_basis_ktx2_url,
        file_format = 'glb'
    `
    console.log(`Asset registrado para ${slug} (${lod})`)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`No se pudo registrar en PostgreSQL: ${message}`)
} finally {
  await sql.end()
}
