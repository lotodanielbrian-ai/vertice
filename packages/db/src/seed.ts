import {
  BENCHMARK_PROFILES,
  RELATIVE_INDEX_PROFILE,
  TIERS,
  familyImageKey,
  familyImageUrl,
  type CatalogItem,
  type Tier,
} from '@pc/shared'
import { sql } from 'drizzle-orm'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDb } from './client'
import { EXPANSION } from './expansion'
import { CHIPSETS, SOCKETS } from './platforms'
import {
  asset3dRigNodes,
  benchmarkProfiles,
  caseSpecs,
  chipsets,
  componentAssets3d,
  componentImages,
  components,
  coolerSocketSupport,
  coolerSpecs,
  cpuSpecs,
  gpuSpecs,
  hardwareBenchmarkScores,
  motherboardSpecs,
  psuSpecs,
  ramSpecs,
  socketChipsets,
  sockets,
  storageSpecs,
} from './schema'

type SeedItem = Omit<CatalogItem, 'id'>

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../..')
const dataDir = resolve(here, '../seed-data')

function isTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value)
}

function loadPrototype(): SeedItem[] {
  const raw = JSON.parse(readFileSync(resolve(dataDir, 'prototype.json'), 'utf8')) as {
    components: SeedItem[]
  }
  return raw.components
}

interface ManifestEntry {
  slug: string
  lod: 'lod_0_ultra' | 'lod_1_high' | 'lod_2_low'
  url: string
  bytes: number
  polygons: number
  draco: boolean
  textureUrl?: string | null
}

function loadManifest(): ManifestEntry[] {
  const path = resolve(root, 'apps/web/public/models/manifest.json')
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, 'utf8')) as ManifestEntry[]
}

function rigFor(fans: number, maxRpm: number) {
  const nodes: {
    nodeName: string
    parent: string | null
    nodeType: string
    offset: { x: number; y: number; z: number }
    axis: { x: number; y: number; z: number } | null
    rpm: number
  }[] = [
    { nodeName: 'backplate', parent: null, nodeType: 'exploded_layer', offset: { x: 0, y: -28, z: 0 }, axis: null, rpm: 0 },
    { nodeName: 'pcb', parent: null, nodeType: 'exploded_layer', offset: { x: 0, y: -12, z: 0 }, axis: null, rpm: 0 },
    { nodeName: 'die', parent: 'pcb', nodeType: 'pcb_die', offset: { x: 0, y: 8, z: 0 }, axis: null, rpm: 0 },
    { nodeName: 'thermal_pads', parent: 'die', nodeType: 'pcb_die', offset: { x: 0, y: 4, z: 0 }, axis: null, rpm: 0 },
    { nodeName: 'heatsink', parent: null, nodeType: 'exploded_layer', offset: { x: 0, y: 22, z: 0 }, axis: null, rpm: 0 },
    { nodeName: 'shroud', parent: null, nodeType: 'exploded_layer', offset: { x: 0, y: 48, z: 0 }, axis: null, rpm: 0 },
  ]
  for (let index = 0; index < fans; index += 1) {
    nodes.push({
      nodeName: `fan_0${index + 1}`,
      parent: 'shroud',
      nodeType: 'fan_pivot',
      offset: { x: 0, y: 6, z: 0 },
      axis: { x: 0, y: 1, z: 0 },
      rpm: maxRpm,
    })
  }
  return nodes
}

async function main() {
  const warnings: string[] = []
  const extractPath = resolve(dataDir, 'extract-warnings.json')
  if (existsSync(extractPath)) {
    warnings.push(...(JSON.parse(readFileSync(extractPath, 'utf8')) as string[]))
  }

  const bySlug = new Map<string, SeedItem>()
  for (const item of loadPrototype()) bySlug.set(item.slug, item)
  for (const item of EXPANSION) {
    if (bySlug.has(item.slug)) warnings.push(`Expansión pisa un slug del prototipo: ${item.slug}`)
    bySlug.set(item.slug, item)
  }

  const xtx = bySlug.get('g_amd_rx9070xtx')
  if (xtx && !/conceptual/i.test(xtx.name)) {
    xtx.name = 'AMD Radeon RX 9070 XTX 24GB (conceptual, no lanzada)'
    warnings.push('g_amd_rx9070xtx: AMD no lanzó una RX 9070 XTX. Se conserva el slug y se marca como conceptual.')
  }

  const alder = bySlug.get('c_12400f')
  if (alder?.cpu && alder.cpu.maxRamGen === 'ddr4') {
    alder.cpu.maxRamGen = 'ddr5'
    warnings.push(
      'c_12400f: el prototipo lo etiqueta como DDR4. Alder Lake admite hasta DDR5; se guarda ese máximo.',
    )
  }

  const catalog = [...bySlug.values()]
  const { db, client } = createDb()

  await db.execute(sql`
    TRUNCATE TABLE
      saved_builds,
      hardware_benchmark_scores,
      benchmark_profiles,
      asset_3d_rig_nodes,
      component_assets_3d,
      component_images,
      cooler_socket_support,
      cooler_specs,
      storage_specs,
      case_specs,
      psu_specs,
      ram_specs,
      motherboard_specs,
      gpu_specs,
      cpu_specs,
      socket_chipsets,
      components,
      chipsets,
      sockets
    RESTART IDENTITY CASCADE
  `)

  const socketIds = new Map<string, string>()
  for (const socket of SOCKETS) {
    const [row] = await db
      .insert(sockets)
      .values({
        name: socket.name,
        physicalType: socket.physicalType,
        pinCount: socket.pinCount,
        releaseYear: socket.releaseYear,
      })
      .returning({ id: sockets.id })
    socketIds.set(socket.name, row.id)
  }

  const chipsetIds = new Map<string, string>()
  for (const chipset of CHIPSETS) {
    const [row] = await db
      .insert(chipsets)
      .values({
        name: chipset.name,
        manufacturer: chipset.manufacturer,
        pcieGenNative: chipset.pcieGenNative,
        maxMemoryChannels: chipset.maxMemoryChannels,
        supportedRamGen: chipset.supportedRamGen,
        supportsOverclocking: chipset.supportsOverclocking,
      })
      .returning({ id: chipsets.id })
    chipsetIds.set(chipset.name, row.id)
    for (const socketName of chipset.sockets) {
      const socketId = socketIds.get(socketName)
      if (!socketId) {
        warnings.push(`Chipset ${chipset.name} referencia un socket inexistente: ${socketName}`)
        continue
      }
      await db.insert(socketChipsets).values({ socketId, chipsetId: row.id })
    }
  }

  const profileIds = new Map<string, string>()
  const profiles = [
    ...BENCHMARK_PROFILES.map((profile) => ({
      name: profile.name,
      resolutionWidth: profile.width,
      resolutionHeight: profile.height,
      targetFps: profile.targetFps,
      cpuWeight: profile.cpuWeight,
      gpuWeight: profile.gpuWeight,
    })),
    {
      name: RELATIVE_INDEX_PROFILE.name,
      resolutionWidth: RELATIVE_INDEX_PROFILE.width,
      resolutionHeight: RELATIVE_INDEX_PROFILE.height,
      targetFps: RELATIVE_INDEX_PROFILE.targetFps,
      cpuWeight: RELATIVE_INDEX_PROFILE.cpuWeight,
      gpuWeight: RELATIVE_INDEX_PROFILE.gpuWeight,
    },
    { name: 'raster_1080p', resolutionWidth: 1920, resolutionHeight: 1080, targetFps: 60, cpuWeight: 0.2, gpuWeight: 0.8 },
    { name: 'raster_1440p', resolutionWidth: 2560, resolutionHeight: 1440, targetFps: 60, cpuWeight: 0.2, gpuWeight: 0.8 },
    { name: 'raster_2160p', resolutionWidth: 3840, resolutionHeight: 2160, targetFps: 60, cpuWeight: 0.2, gpuWeight: 0.8 },
    { name: 'rt_1080p', resolutionWidth: 1920, resolutionHeight: 1080, targetFps: 60, cpuWeight: 0.2, gpuWeight: 0.8 },
    { name: 'rt_1440p', resolutionWidth: 2560, resolutionHeight: 1440, targetFps: 60, cpuWeight: 0.2, gpuWeight: 0.8 },
    { name: 'rt_2160p', resolutionWidth: 3840, resolutionHeight: 2160, targetFps: 60, cpuWeight: 0.2, gpuWeight: 0.8 },
  ]
  for (const profile of profiles) {
    const [row] = await db.insert(benchmarkProfiles).values(profile).returning({ id: benchmarkProfiles.id })
    profileIds.set(profile.name, row.id)
  }
  const indexProfileId = profileIds.get(RELATIVE_INDEX_PROFILE.name)
  if (!indexProfileId) throw new Error('Perfil relative_index no insertado')

  const componentIds = new Map<string, string>()
  for (const item of catalog) {
    const tier = isTier(item.baseTier) ? item.baseTier : 'C'
    if (!isTier(item.baseTier)) warnings.push(`${item.slug}: tier "${item.baseTier}" fuera de enum, se usa C`)
    if (!item.releaseYear) {
      warnings.push(`${item.slug}: sin año, se omite`)
      continue
    }
    const [row] = await db
      .insert(components)
      .values({
        slug: item.slug,
        name: item.name,
        manufacturer: item.manufacturer,
        type: item.type,
        releaseDate: `${item.releaseYear}-01-01`,
        launchMsrpUsd: item.priceUsd,
        baseTier: tier,
        tdpWatts: item.tdpWatts,
        isDiscontinued: item.releaseYear < 2020,
      })
      .returning({ id: components.id })
    componentIds.set(item.slug, row.id)

    if (item.cpu) {
      const socketId = socketIds.get(item.cpu.socketName)
      if (!socketId) {
        warnings.push(`${item.slug}: socket no catalogado ${item.cpu.socketName}`)
        continue
      }
      await db.insert(cpuSpecs).values({
        componentId: row.id,
        socketId,
        architecture: item.cpu.architecture,
        lithographyNm: item.cpu.lithographyNm,
        totalPhysicalCores: item.cpu.cores,
        totalThreads: item.cpu.threads,
        performanceCores: item.cpu.performanceCores,
        efficiencyCores: item.cpu.efficiencyCores,
        baseClockMhz: item.cpu.baseClockMhz,
        boostClockMhz: item.cpu.boostClockMhz,
        l1CacheKb: item.cpu.l1CacheKb,
        l2CacheKb: item.cpu.l2CacheKb,
        l3CacheKb: item.cpu.l3CacheKb,
        maxSupportedRamGen: item.cpu.maxRamGen,
        maxMemoryChannels: item.cpu.maxMemoryChannels,
        integratedGraphicsName: item.cpu.integratedGraphics,
        peakTransientTdpWatts: item.cpu.peakTransientTdpWatts,
        instructionSetsSupported: item.cpu.instructionSets,
        ipcIndex: item.cpu.ipcIndex,
      })
    }

    if (item.gpu) {
      await db.insert(gpuSpecs).values({
        componentId: row.id,
        architecture: item.gpu.architecture,
        busInterface: item.gpu.busInterface,
        busLanes: item.gpu.busLanes,
        lithographyNm: item.gpu.lithographyNm,
        baseEngineClockMhz: item.gpu.baseClockMhz,
        boostEngineClockMhz: item.gpu.boostClockMhz,
        shaderCoresCount: item.gpu.shaderCores,
        textureMappingUnits: item.gpu.tmus,
        renderOutputUnits: item.gpu.rops,
        rayTracingCores: item.gpu.rayTracingCores,
        tensorAiCores: item.gpu.tensorCores,
        vramType: item.gpu.vramType,
        vramCapacityMb: item.gpu.vramMb,
        memoryBusWidthBits: item.gpu.memoryBusWidthBits,
        memoryBandwidthGbps: item.gpu.memoryBandwidthGbps,
        lengthMm: item.gpu.lengthMm,
        heightMm: item.gpu.heightMm,
        slotWidth: item.gpu.slotWidth,
        powerConnectors: item.gpu.powerConnectors,
        recommendedPsuWatts: item.gpu.recommendedPsuWatts,
        peakTransientSpikeWatts: item.gpu.peakTransientSpikeWatts,
        directxMaxVersion: item.gpu.directxMax,
        vulkanSupported: item.gpu.vulkan,
        visualProfile: item.gpu.visual,
      })
    }

    if (item.motherboard) {
      const socketId = socketIds.get(item.motherboard.socketName)
      const chipsetId = chipsetIds.get(item.motherboard.chipsetName)
      if (!socketId || !chipsetId) {
        warnings.push(`${item.slug}: placa sin socket/chipset (${item.motherboard.socketName} / ${item.motherboard.chipsetName})`)
      } else {
        await db.insert(motherboardSpecs).values({
          componentId: row.id,
          socketId,
          chipsetId,
          formFactor: item.motherboard.formFactor,
          ramGen: item.motherboard.ramGen,
          ramSlots: item.motherboard.ramSlots,
          m2Slots: item.motherboard.m2Slots,
          pcieSlot: item.motherboard.pcieSlot,
          pcieLanes: item.motherboard.pcieLanes,
          agpSlot: item.motherboard.agpSlot,
          storageInterfaces: item.motherboard.storageInterfaces,
        })
      }
    }

    if (item.ram?.gen && item.ram.capacityMb && item.ram.mhz) {
      await db.insert(ramSpecs).values({
        componentId: row.id,
        gen: item.ram.gen,
        capacityMb: item.ram.capacityMb,
        modules: item.ram.modules,
        mhz: item.ram.mhz,
        casLatency: item.ram.cas,
        voltage: item.ram.voltage,
      })
    }

    if (item.psu) {
      await db.insert(psuSpecs).values({
        componentId: row.id,
        wattage: item.psu.wattage,
        formFactor: item.psu.formFactor,
        modular: item.psu.modular,
        efficiency: item.psu.efficiency,
        atxVersion: item.psu.atxVersion,
        rail12vAmps: item.psu.rail12vAmps,
        rail5vAmps: item.psu.rail5vAmps,
        rail33vAmps: item.psu.rail33vAmps,
        connectors: item.psu.connectors,
        topology: item.psu.topology,
        has12vhpwr: item.psu.has12vhpwr,
      })
    }

    if (item.case) {
      await db.insert(caseSpecs).values({
        componentId: row.id,
        supportedFormFactors: item.case.supportedFormFactors,
        maxGpuLengthMm: item.case.maxGpuLengthMm,
        maxCoolerHeightMm: item.case.maxCoolerHeightMm,
        radiatorSupportMm: item.case.radiatorSupportMm,
        fanSlots: item.case.fanSlots,
        airflowScore: item.case.airflowScore,
        psuFormFactor: item.case.psuFormFactor,
      })
    }

    if (item.storage?.interface && item.storage.capacityMb) {
      await db.insert(storageSpecs).values({
        componentId: row.id,
        interface: item.storage.interface,
        capacityMb: item.storage.capacityMb,
        readMbS: item.storage.readMbS,
        kind: item.storage.kind,
      })
    }

    if (item.cooler) {
      await db.insert(coolerSpecs).values({
        componentId: row.id,
        tdpMax: item.cooler.tdpMax,
        coolerType: item.cooler.coolerType,
        maxRpm: item.cooler.maxRpm,
        noiseDb: item.cooler.noiseDb,
        heightMm: item.cooler.heightMm,
      })
      for (const socketName of item.cooler.socketNames) {
        const socketId = socketIds.get(socketName)
        if (!socketId) {
          warnings.push(`${item.slug}: anclaje a socket inexistente ${socketName}`)
          continue
        }
        await db.insert(coolerSocketSupport).values({ componentId: row.id, socketId })
      }
    }

    await db.insert(hardwareBenchmarkScores).values({
      componentId: row.id,
      profileId: indexProfileId,
      normalizedScore: item.performanceScore ?? 0,
      measuredTier: tier,
    })
  }

  const benchPath = resolve(dataDir, 'gpu-benchmarks.json')
  if (existsSync(benchPath)) {
    const benches = JSON.parse(readFileSync(benchPath, 'utf8')) as {
      slug: string
      raster: { p1080: number; p1440: number; p2160: number }
      rt: { p1080: number | null; p1440: number | null; p2160: number | null }
      source: string
    }[]
    const fpsTier = (fps: number): Tier => {
      const index = (fps * 138) / 175.5
      if (index >= 100) return 'S+'
      if (index >= 85) return 'S'
      if (index >= 74) return 'A'
      if (index >= 63) return 'B'
      if (index >= 52) return 'C'
      if (index >= 40) return 'D'
      if (index >= 28) return 'E'
      return 'F'
    }
    const keys = [
      ['raster_1080p', 'raster', 'p1080'],
      ['raster_1440p', 'raster', 'p1440'],
      ['raster_2160p', 'raster', 'p2160'],
      ['rt_1080p', 'rt', 'p1080'],
      ['rt_1440p', 'rt', 'p1440'],
      ['rt_2160p', 'rt', 'p2160'],
    ] as const
    for (const bench of benches) {
      const componentId = componentIds.get(bench.slug)
      if (!componentId) {
        warnings.push(`${bench.slug}: benchmark sin componente`)
        continue
      }
      for (const [profile, group, key] of keys) {
        const fps = bench[group][key]
        const profileId = profileIds.get(profile)
        if (fps == null || !profileId) continue
        await db.insert(hardwareBenchmarkScores).values({
          componentId,
          profileId,
          normalizedScore: fps,
          measuredTier: fpsTier(bench.raster.p1440),
          sourceUrl: bench.source,
        })
      }
    }
  }

  const manifest = loadManifest()
  const manifestKey = new Set(manifest.map((entry) => `${entry.slug}:${entry.lod}`))

  for (const item of catalog) {
    if (item.type !== 'gpu' || !item.gpu) continue
    const componentId = componentIds.get(item.slug)
    if (!componentId) continue
    const length = item.gpu.lengthMm ?? 200
    const proceduralLod = item.gpu.visual.form.includes('retro')
      ? 'lod_2_low'
      : item.gpu.visual.form === 'massive' || item.gpu.visual.form === 'dual-gpu'
        ? 'lod_0_ultra'
        : 'lod_1_high'
    const assets: ManifestEntry[] = [
      ...manifest.filter((entry) => entry.slug === item.slug),
    ]
    if (!manifestKey.has(`${item.slug}:${proceduralLod}`)) {
      const polygons = proceduralLod === 'lod_0_ultra' ? 100000 : proceduralLod === 'lod_1_high' ? 30000 : 5000
      assets.push({
        slug: item.slug,
        lod: proceduralLod,
        url: `procedural://${item.slug}`,
        bytes: 0,
        polygons,
        draco: false,
        textureUrl: null,
      })
    }

    for (const asset of assets) {
      const [created] = await db
        .insert(componentAssets3d)
        .values({
          componentId,
          lodLevel: asset.lod,
          fileFormat: asset.url.startsWith('procedural://') ? 'procedural' : 'glb',
          meshStorageUrl: asset.url,
          dracoCompressed: asset.draco,
          fileSizeBytes: asset.bytes,
          polygonCount: asset.polygons,
          textureBasisKtx2Url: asset.textureUrl ?? null,
          boundingBoxDimensionsMm: { x: length, y: 120, z: 42 },
        })
        .returning({ id: componentAssets3d.id })

      const nodes = rigFor(item.gpu.visual.fans, 1800)
      const nodeIds = new Map<string, string>()
      for (const node of nodes) {
        const [inserted] = await db
          .insert(asset3dRigNodes)
          .values({
            asset3dId: created.id,
            nodeName: node.nodeName,
            parentNodeId: node.parent ? nodeIds.get(node.parent) ?? null : null,
            nodeType: node.nodeType,
            explodedOffsetVector: node.offset,
            rotationAxisVector: node.axis,
            maxRpmAnimation: node.rpm,
          })
          .returning({ id: asset3dRigNodes.id })
        nodeIds.set(node.nodeName, inserted.id)
      }
    }
  }

  const manifestPath = resolve(dataDir, 'images-manifest.json')
  const imageManifest = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<
        string,
        {
          url: string
          thumbUrl?: string | null
          sourcePageUrl?: string | null
          author?: string | null
          license?: string | null
          width?: number | null
          height?: number | null
          kind?: 'photo' | 'manual'
        }
      >)
    : {}
  for (const item of catalog) {
    const componentId = componentIds.get(item.slug)
    if (!componentId) continue
    const photo = imageManifest[item.slug]
    if (photo) {
      await db.insert(componentImages).values({
        componentId,
        url: photo.url,
        thumbUrl: photo.thumbUrl ?? photo.url,
        sourcePageUrl: photo.sourcePageUrl ?? null,
        author: photo.author ?? null,
        license: photo.license ?? null,
        kind: photo.kind === 'manual' ? 'manual' : 'photo',
        width: photo.width ?? null,
        height: photo.height ?? null,
      })
    } else {
      const url = familyImageUrl(familyImageKey(item))
      await db.insert(componentImages).values({
        componentId,
        url,
        thumbUrl: url,
        kind: 'family_fallback',
      })
    }
  }

  writeFileSync(resolve(dataDir, 'seed-warnings.json'), JSON.stringify(warnings, null, 2))
  console.log(`Catálogo sembrado: ${componentIds.size} componentes. Advertencias: ${warnings.length}`)
  await client.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
