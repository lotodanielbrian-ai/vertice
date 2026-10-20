import type { Database } from '@pc/db'
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
} from '@pc/db'
import type { GpuBenchmarks } from '@pc/shared'
import type {
  Asset3D,
  AssetRigNode,
  BoardFormFactor,
  BusInterface,
  CatalogItem,
  CoolerType,
  GpuVisual,
  PsuFormFactor,
  PsuModular,
  RamGen,
  StorageInterface,
  Tier,
  Vec3,
} from '@pc/shared'

export interface PlatformMatrix {
  socketChipsets: { socketName: string; chipsetName: string }[]
}

function yearOf(value: string): number {
  return Number(value.slice(0, 4))
}

function asRecord(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, number>
}

function asVec(value: unknown): Vec3 {
  const record = (value ?? {}) as Partial<Vec3>
  return { x: Number(record.x ?? 0), y: Number(record.y ?? 0), z: Number(record.z ?? 0) }
}

function asVisual(value: unknown): GpuVisual {
  const record = (value ?? {}) as Partial<GpuVisual>
  return {
    form: typeof record.form === 'string' ? record.form : 'dual',
    fans: typeof record.fans === 'number' ? record.fans : 0,
    color: typeof record.color === 'number' ? record.color : 0x18181b,
    accentColor: typeof record.accentColor === 'number' ? record.accentColor : 0x22d3ee,
  }
}

export async function loadCatalog(db: Database): Promise<{ items: CatalogItem[]; platforms: PlatformMatrix }> {
    const [
      componentRows,
      cpuRows,
      gpuRows,
      boardRows,
      ramRows,
      psuRows,
      caseRows,
      storageRows,
      coolerRows,
      socketRows,
      chipsetRows,
      pairRows,
      coolerSocketRows,
      assetRows,
      imageRows,
      rigRows,
      scoreRows,
      profileRows,
    ] = await Promise.all([
      db.select().from(components),
      db.select().from(cpuSpecs),
      db.select().from(gpuSpecs),
      db.select().from(motherboardSpecs),
      db.select().from(ramSpecs),
      db.select().from(psuSpecs),
      db.select().from(caseSpecs),
      db.select().from(storageSpecs),
      db.select().from(coolerSpecs),
      db.select().from(sockets),
      db.select().from(chipsets),
      db.select().from(socketChipsets),
      db.select().from(coolerSocketSupport),
      db.select().from(componentAssets3d),
      db.select().from(componentImages),
      db.select().from(asset3dRigNodes),
      db.select().from(hardwareBenchmarkScores),
      db.select().from(benchmarkProfiles),
    ])

    const socketName = new Map(socketRows.map((row) => [row.id, row.name]))
    const chipsetName = new Map(chipsetRows.map((row) => [row.id, row.name]))
    const profileName = new Map(profileRows.map((row) => [row.id, row.name]))
    const indexProfileId = profileRows.find((row) => row.name === 'relative_index')?.id
    const scoreByComponent = new Map(
      scoreRows
        .filter((row) => row.profileId === indexProfileId)
        .map((row) => [row.componentId, row.normalizedScore]),
    )
    const emptyFps = () => ({ p1080: null, p1440: null, p2160: null })
    const benchmarksByComponent = new Map<string, GpuBenchmarks>()
    for (const row of scoreRows) {
      const name = profileName.get(row.profileId)
      if (!name || (!name.startsWith('raster_') && !name.startsWith('rt_'))) continue
      const entry = benchmarksByComponent.get(row.componentId) ?? { raster: emptyFps(), rt: emptyFps(), source: null }
      const bucket = name.startsWith('rt_') ? entry.rt : entry.raster
      if (name.endsWith('1080p')) bucket.p1080 = row.normalizedScore
      else if (name.endsWith('1440p')) bucket.p1440 = row.normalizedScore
      else if (name.endsWith('2160p')) bucket.p2160 = row.normalizedScore
      if (row.sourceUrl) entry.source = row.sourceUrl
      benchmarksByComponent.set(row.componentId, entry)
    }
    const cpuById = new Map(cpuRows.map((row) => [row.componentId, row]))
    const gpuById = new Map(gpuRows.map((row) => [row.componentId, row]))
    const boardById = new Map(boardRows.map((row) => [row.componentId, row]))
    const ramById = new Map(ramRows.map((row) => [row.componentId, row]))
    const psuById = new Map(psuRows.map((row) => [row.componentId, row]))
    const caseById = new Map(caseRows.map((row) => [row.componentId, row]))
    const storageById = new Map(storageRows.map((row) => [row.componentId, row]))
    const coolerById = new Map(coolerRows.map((row) => [row.componentId, row]))
    const coolerSockets = new Map<string, string[]>()
    for (const link of coolerSocketRows) {
      const name = socketName.get(link.socketId)
      if (!name) continue
      const list = coolerSockets.get(link.componentId) ?? []
      list.push(name)
      coolerSockets.set(link.componentId, list)
    }

    const rigByAsset = new Map<string, AssetRigNode[]>()
    const nodeName = new Map(rigRows.map((row) => [row.id, row.nodeName]))
    for (const node of rigRows) {
      const list = rigByAsset.get(node.asset3dId) ?? []
      list.push({
        nodeName: node.nodeName,
        parentNodeName: node.parentNodeId ? (nodeName.get(node.parentNodeId) ?? null) : null,
        nodeType: node.nodeType,
        explodedOffset: asVec(node.explodedOffsetVector),
        rotationAxis: node.rotationAxisVector ? asVec(node.rotationAxisVector) : null,
        maxRpm: node.maxRpmAnimation ?? 0,
      })
      rigByAsset.set(node.asset3dId, list)
    }
    const imageByComponent = new Map(imageRows.map((row) => [row.componentId, row]))
    const assetsByComponent = new Map<string, Asset3D[]>()
    for (const asset of assetRows) {
      const list = assetsByComponent.get(asset.componentId) ?? []
      list.push({
        lod: asset.lodLevel,
        fileFormat: asset.fileFormat,
        url: asset.meshStorageUrl,
        dracoCompressed: asset.dracoCompressed,
        fileSizeBytes: asset.fileSizeBytes,
        polygonCount: asset.polygonCount,
        textureUrl: asset.textureBasisKtx2Url,
        boundingBoxMm: asVec(asset.boundingBoxDimensionsMm),
        rig: rigByAsset.get(asset.id) ?? [],
      })
      assetsByComponent.set(asset.componentId, list)
    }

    const items: CatalogItem[] = componentRows.map((row) => {
      const item: CatalogItem = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        manufacturer: row.manufacturer,
        type: row.type,
        releaseYear: yearOf(row.releaseDate),
        priceUsd: row.launchMsrpUsd,
        baseTier: row.baseTier as Tier,
        tdpWatts: row.tdpWatts,
        performanceScore: scoreByComponent.get(row.id) ?? 0,
        benchmarks: benchmarksByComponent.get(row.id),
        assets3d: assetsByComponent.get(row.id) ?? [],
        image: imageByComponent.has(row.id)
          ? {
              url: imageByComponent.get(row.id)!.url,
              thumbUrl: imageByComponent.get(row.id)!.thumbUrl,
              author: imageByComponent.get(row.id)!.author,
              license: imageByComponent.get(row.id)!.license,
              sourceUrl: imageByComponent.get(row.id)!.sourcePageUrl,
              kind: imageByComponent.get(row.id)!.kind,
            }
          : undefined,
      }
      const cpu = cpuById.get(row.id)
      if (cpu) {
        item.cpu = {
          socketName: socketName.get(cpu.socketId) ?? '',
          architecture: cpu.architecture,
          lithographyNm: cpu.lithographyNm,
          cores: cpu.totalPhysicalCores,
          threads: cpu.totalThreads,
          performanceCores: cpu.performanceCores ?? 0,
          efficiencyCores: cpu.efficiencyCores ?? 0,
          baseClockMhz: cpu.baseClockMhz,
          boostClockMhz: cpu.boostClockMhz,
          l1CacheKb: cpu.l1CacheKb,
          l2CacheKb: cpu.l2CacheKb,
          l3CacheKb: cpu.l3CacheKb,
          maxRamGen: cpu.maxSupportedRamGen,
          maxMemoryChannels: cpu.maxMemoryChannels,
          integratedGraphics: cpu.integratedGraphicsName,
          peakTransientTdpWatts: cpu.peakTransientTdpWatts,
          instructionSets: cpu.instructionSetsSupported ?? [],
          ipcIndex: cpu.ipcIndex,
        }
      }
      const gpu = gpuById.get(row.id)
      if (gpu) {
        item.gpu = {
          architecture: gpu.architecture,
          busInterface: gpu.busInterface as BusInterface | null,
          busLanes: gpu.busLanes,
          lithographyNm: gpu.lithographyNm,
          baseClockMhz: gpu.baseEngineClockMhz,
          boostClockMhz: gpu.boostEngineClockMhz,
          shaderCores: gpu.shaderCoresCount,
          tmus: gpu.textureMappingUnits,
          rops: gpu.renderOutputUnits,
          rayTracingCores: gpu.rayTracingCores ?? 0,
          tensorCores: gpu.tensorAiCores ?? 0,
          vramType: gpu.vramType,
          vramMb: gpu.vramCapacityMb,
          memoryBusWidthBits: gpu.memoryBusWidthBits,
          memoryBandwidthGbps: gpu.memoryBandwidthGbps,
          lengthMm: gpu.lengthMm,
          heightMm: gpu.heightMm,
          slotWidth: gpu.slotWidth,
          powerConnectors: asRecord(gpu.powerConnectors),
          recommendedPsuWatts: gpu.recommendedPsuWatts,
          peakTransientSpikeWatts: gpu.peakTransientSpikeWatts,
          directxMax: gpu.directxMaxVersion,
          vulkan: gpu.vulkanSupported,
          visual: asVisual(gpu.visualProfile),
        }
      }
      const board = boardById.get(row.id)
      if (board) {
        item.motherboard = {
          socketName: socketName.get(board.socketId) ?? '',
          chipsetName: chipsetName.get(board.chipsetId) ?? '',
          formFactor: board.formFactor as BoardFormFactor,
          ramGen: board.ramGen,
          ramSlots: board.ramSlots,
          m2Slots: board.m2Slots,
          pcieSlot: board.pcieSlot as BusInterface | null,
          pcieLanes: board.pcieLanes,
          agpSlot: board.agpSlot as BusInterface | null,
          storageInterfaces: (board.storageInterfaces ?? []) as StorageInterface[],
        }
      }
      const ram = ramById.get(row.id)
      if (ram) {
        item.ram = {
          gen: ram.gen as RamGen,
          capacityMb: ram.capacityMb,
          modules: ram.modules,
          mhz: ram.mhz,
          cas: ram.casLatency,
          voltage: ram.voltage,
        }
      }
      const psu = psuById.get(row.id)
      if (psu) {
        item.psu = {
          wattage: psu.wattage,
          formFactor: psu.formFactor as PsuFormFactor,
          modular: psu.modular as PsuModular | null,
          efficiency: psu.efficiency,
          atxVersion: psu.atxVersion,
          rail12vAmps: psu.rail12vAmps,
          rail5vAmps: psu.rail5vAmps,
          rail33vAmps: psu.rail33vAmps,
          connectors: asRecord(psu.connectors),
          topology: psu.topology === 'group' || psu.topology === 'dc_dc' ? psu.topology : null,
          has12vhpwr: psu.has12vhpwr,
        }
      }
      const pcCase = caseById.get(row.id)
      if (pcCase) {
        item.case = {
          supportedFormFactors: (pcCase.supportedFormFactors ?? []) as BoardFormFactor[],
          maxGpuLengthMm: pcCase.maxGpuLengthMm,
          maxCoolerHeightMm: pcCase.maxCoolerHeightMm,
          radiatorSupportMm: pcCase.radiatorSupportMm ?? [],
          fanSlots: pcCase.fanSlots,
          airflowScore: pcCase.airflowScore,
          psuFormFactor: pcCase.psuFormFactor as PsuFormFactor,
        }
      }
      const disk = storageById.get(row.id)
      if (disk) {
        item.storage = {
          interface: disk.interface as StorageInterface,
          capacityMb: disk.capacityMb,
          readMbS: disk.readMbS,
          kind: disk.kind === 'hdd' ? 'hdd' : 'ssd',
        }
      }
      const cooler = coolerById.get(row.id)
      if (cooler) {
        item.cooler = {
          tdpMax: cooler.tdpMax,
          coolerType: cooler.coolerType as CoolerType,
          maxRpm: cooler.maxRpm,
          noiseDb: cooler.noiseDb,
          heightMm: cooler.heightMm,
          socketNames: coolerSockets.get(row.id) ?? [],
        }
      }
      return item
    })

    const platforms: PlatformMatrix = {
      socketChipsets: pairRows.flatMap((pair) => {
        const socket = socketName.get(pair.socketId)
        const chipset = chipsetName.get(pair.chipsetId)
        return socket && chipset ? [{ socketName: socket, chipsetName: chipset }] : []
      }),
    }
    return { items, platforms }
}
