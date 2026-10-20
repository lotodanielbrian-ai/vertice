import { z } from 'zod'

export const COMPONENT_TYPES = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'psu',
  'case',
  'storage',
  'cooler',
] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const TIERS = ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'] as const
export type Tier = (typeof TIERS)[number]

export const TIER_VALUE: Record<Tier, number> = {
  'S+': 8,
  S: 7,
  A: 6,
  B: 5,
  C: 4,
  D: 3,
  E: 2,
  F: 1,
}

export function tierFromValue(value: number): Tier {
  if (value >= 7.5) return 'S+'
  if (value >= 6.5) return 'S'
  if (value >= 5.5) return 'A'
  if (value >= 4.5) return 'B'
  if (value >= 3.5) return 'C'
  if (value >= 2.5) return 'D'
  if (value >= 1.5) return 'E'
  return 'F'
}

export function tierFromPercentile(percentile: number): Tier {
  if (percentile >= 98) return 'S+'
  if (percentile >= 90) return 'S'
  if (percentile >= 75) return 'A'
  if (percentile >= 55) return 'B'
  if (percentile >= 35) return 'C'
  if (percentile >= 18) return 'D'
  if (percentile >= 8) return 'E'
  return 'F'
}

export const BUS_INTERFACES = [
  'isa',
  'pci',
  'agp_1x',
  'agp_2x',
  'agp_4x',
  'agp_8x',
  'pcie_1_0',
  'pcie_2_0',
  'pcie_3_0',
  'pcie_4_0',
  'pcie_5_0',
  'pcie_6_0',
] as const
export type BusInterface = (typeof BUS_INTERFACES)[number]

export const RAM_GENS = ['sdr', 'ddr', 'ddr2', 'ddr3', 'ddr4', 'ddr5'] as const
export type RamGen = (typeof RAM_GENS)[number]

export const RAM_GEN_RANK: Record<RamGen, number> = {
  sdr: 0,
  ddr: 1,
  ddr2: 2,
  ddr3: 3,
  ddr4: 4,
  ddr5: 5,
}

export const PSU_FORM_FACTORS = ['atx', 'sfx', 'sfx_l', 'tfx', 'flex_atx', 'at_legacy'] as const
export type PsuFormFactor = (typeof PSU_FORM_FACTORS)[number]

export const PSU_MODULAR = ['non_modular', 'semi_modular', 'full_modular'] as const
export type PsuModular = (typeof PSU_MODULAR)[number]

export const BOARD_FORM_FACTORS = ['eatx', 'atx', 'micro_atx', 'mini_itx', 'proprietary'] as const
export type BoardFormFactor = (typeof BOARD_FORM_FACTORS)[number]

export const STORAGE_INTERFACES = [
  'pata',
  'sata1',
  'sata2',
  'sata3',
  'sas',
  'nvme_3',
  'nvme_4',
  'nvme_5',
] as const
export type StorageInterface = (typeof STORAGE_INTERFACES)[number]

export const COOLER_TYPES = ['air', 'liquid', 'stock'] as const
export type CoolerType = (typeof COOLER_TYPES)[number]

export const LOD_LEVELS = ['lod_0_ultra', 'lod_1_high', 'lod_2_low'] as const
export type LodLevel = (typeof LOD_LEVELS)[number]

export const WORKLOADS = ['retro', 'esports', 'aaa', 'rt', 'path', 'render', 'encode'] as const
export type Workload = (typeof WORKLOADS)[number]

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface CpuDetails {
  socketName: string
  architecture: string
  lithographyNm: number | null
  cores: number
  threads: number
  performanceCores: number
  efficiencyCores: number
  baseClockMhz: number | null
  boostClockMhz: number | null
  l1CacheKb: number
  l2CacheKb: number
  l3CacheKb: number
  maxRamGen: RamGen
  maxMemoryChannels: number
  integratedGraphics: string | null
  peakTransientTdpWatts: number | null
  instructionSets: string[]
  ipcIndex: number | null
}

export interface GpuVisual {
  form: string
  fans: number
  color: number
  accentColor: number
}

export interface GpuDetails {
  architecture: string
  busInterface: BusInterface | null
  busLanes: number | null
  lithographyNm: number | null
  baseClockMhz: number | null
  boostClockMhz: number | null
  shaderCores: number | null
  tmus: number | null
  rops: number | null
  rayTracingCores: number
  tensorCores: number
  vramType: string | null
  vramMb: number | null
  memoryBusWidthBits: number | null
  memoryBandwidthGbps: number | null
  lengthMm: number | null
  heightMm: number | null
  slotWidth: number | null
  powerConnectors: Record<string, number> | null
  recommendedPsuWatts: number | null
  peakTransientSpikeWatts: number | null
  directxMax: number | null
  vulkan: boolean
  visual: GpuVisual
}

export interface MotherboardDetails {
  socketName: string
  chipsetName: string
  formFactor: BoardFormFactor
  ramGen: RamGen
  ramSlots: number
  m2Slots: number
  pcieSlot: BusInterface | null
  pcieLanes: number | null
  agpSlot: BusInterface | null
  storageInterfaces: StorageInterface[]
}

export interface RamDetails {
  gen: RamGen
  capacityMb: number
  modules: number
  mhz: number
  cas: number | null
  voltage: number | null
}

export interface PsuDetails {
  wattage: number
  formFactor: PsuFormFactor
  modular: PsuModular | null
  efficiency: string
  atxVersion: number
  rail12vAmps: number | null
  rail5vAmps: number | null
  rail33vAmps: number | null
  connectors: Record<string, number> | null
  topology: 'dc_dc' | 'group' | null
  has12vhpwr: boolean
}

export interface CaseDetails {
  supportedFormFactors: BoardFormFactor[]
  maxGpuLengthMm: number
  maxCoolerHeightMm: number
  radiatorSupportMm: number[]
  fanSlots: number
  airflowScore: number
  psuFormFactor: PsuFormFactor
}

export interface StorageDetails {
  interface: StorageInterface
  capacityMb: number
  readMbS: number | null
  kind: 'ssd' | 'hdd'
}

export interface CoolerDetails {
  tdpMax: number
  coolerType: CoolerType
  maxRpm: number
  noiseDb: number | null
  heightMm: number | null
  socketNames: string[]
}

export interface AssetRigNode {
  nodeName: string
  parentNodeName: string | null
  nodeType: string
  explodedOffset: Vec3
  rotationAxis: Vec3 | null
  maxRpm: number
}

export interface Asset3D {
  lod: LodLevel
  fileFormat: string
  url: string
  dracoCompressed: boolean
  fileSizeBytes: number
  polygonCount: number
  textureUrl: string | null
  boundingBoxMm: Vec3
  rig: AssetRigNode[]
}

export type ImageKind = 'photo' | 'family_fallback' | 'manual'

export interface ComponentImageInfo {
  url: string
  thumbUrl: string | null
  author: string | null
  license: string | null
  sourceUrl: string | null
  kind: ImageKind
}

/** Ilustración de familia cuando no hay foto real. */
export function familyImageKey(item: {
  type: ComponentType
  gpu?: { visual?: { form?: string } }
  storage?: { kind?: string }
  cooler?: { coolerType?: string }
}): string {
  if (item.type === 'gpu') {
    const form = item.gpu?.visual?.form ?? 'dual'
    if (form.includes('retro')) return 'gpu-retro'
    if (form === 'blower') return 'gpu-blower'
    if (form === 'triple') return 'gpu-triple'
    if (form === 'massive') return 'gpu-massive'
    if (form === 'dual-gpu') return 'gpu-dualgpu'
    if (form === 'liquid-aio') return 'gpu-liquid'
    return 'gpu-dual'
  }
  if (item.type === 'storage') return item.storage?.kind === 'hdd' ? 'hdd' : 'ssd'
  if (item.type === 'cooler') return item.cooler?.coolerType === 'liquid' ? 'cooler-liquid' : 'cooler-air'
  return item.type
}

export function familyImageUrl(key: string): string {
  return `/images/families/${key}.png`
}

/** Marcas del showroom. ATI se agrupa con AMD. */
export const SHOWROOM_BRANDS = ['NVIDIA', 'AMD', 'Intel'] as const
export type ShowroomBrand = (typeof SHOWROOM_BRANDS)[number]

export const BRAND_THEME: Record<ShowroomBrand, { hex: string; glow: string; ink: string }> = {
  NVIDIA: { hex: '#76b900', glow: 'rgba(118, 185, 0, 0.35)', ink: '#052e16' },
  AMD: { hex: '#ed1c24', glow: 'rgba(237, 28, 36, 0.35)', ink: '#ffffff' },
  Intel: { hex: '#0071c5', glow: 'rgba(0, 113, 197, 0.4)', ink: '#ffffff' },
}

export function brandOf(item: { manufacturer: string }): ShowroomBrand | null {
  const name = item.manufacturer.trim().toLowerCase()
  if (name === 'nvidia') return 'NVIDIA'
  if (name === 'amd' || name === 'ati') return 'AMD'
  if (name === 'intel') return 'Intel'
  return null
}

/** SKU que el catálogo conserva como referencia, pero que no salió al mercado. */
export function isConceptual(item: { name: string }): boolean {
  return /conceptual/i.test(item.name)
}

export interface ResolutionFps {
  p1080: number | null
  p1440: number | null
  p2160: number | null
}

/** FPS promedio curados. rt es null cuando la tarjeta no acelera ray tracing. */
export interface GpuBenchmarks {
  raster: ResolutionFps
  rt: ResolutionFps
  source: string | null
}

export interface CatalogItem {
  id: string
  slug: string
  name: string
  manufacturer: string
  type: ComponentType
  releaseYear: number
  priceUsd: number | null
  baseTier: Tier
  tdpWatts: number
  /** Índice relativo curado (prototipo o especificación publicada). 0 si no hay dato. */
  performanceScore: number
  benchmarks?: GpuBenchmarks
  cpu?: CpuDetails
  gpu?: GpuDetails
  motherboard?: MotherboardDetails
  ram?: RamDetails
  psu?: PsuDetails
  case?: CaseDetails
  storage?: StorageDetails
  cooler?: CoolerDetails
  assets3d?: Asset3D[]
  image?: ComponentImageInfo
}

export interface ResolvedBuild {
  cpu: CatalogItem | null
  gpu: CatalogItem | null
  motherboard: CatalogItem | null
  ram: CatalogItem | null
  psu: CatalogItem | null
  case: CatalogItem | null
  storage: CatalogItem | null
  cooler: CatalogItem | null
}

export const BUILD_SLOTS = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'cooler',
  'storage',
  'case',
  'psu',
] as const
export type BuildSlot = (typeof BUILD_SLOTS)[number]

export const buildSelectionSchema = z.object({
  cpu: z.string().nullable().optional(),
  gpu: z.string().nullable().optional(),
  motherboard: z.string().nullable().optional(),
  ram: z.string().nullable().optional(),
  psu: z.string().nullable().optional(),
  case: z.string().nullable().optional(),
  storage: z.string().nullable().optional(),
  cooler: z.string().nullable().optional(),
})

export type BuildSelection = z.infer<typeof buildSelectionSchema>

export interface LegendaryPreset {
  id: string
  title: string
  description: string
  build: BuildSelection
}

export const MARKET_CATEGORIES = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'cooler',
  'storage',
  'psu',
  'case',
  'monitor',
  'peripheral',
] as const
export type MarketCategory = (typeof MARKET_CATEGORIES)[number]

/** Oferta publicada por una tienda en HardGamers. El precio está en pesos. */
export interface MarketOffer {
  id: string
  name: string
  priceArs: number
  imageUrl: string | null
  store: string
  url: string
  available: boolean
}

export interface MarketPage {
  offers: MarketOffer[]
  nextPage: number | null
}

export interface Issue {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  componentSlugs: string[]
}

export const PCIE_RANK: Record<string, number> = {
  pcie_1_0: 1,
  pcie_2_0: 2,
  pcie_3_0: 3,
  pcie_4_0: 4,
  pcie_5_0: 5,
  pcie_6_0: 6,
}

export function isAgp(bus: BusInterface | null | undefined): boolean {
  return !!bus && bus.startsWith('agp')
}

export function isPcie(bus: BusInterface | null | undefined): boolean {
  return !!bus && bus.startsWith('pcie')
}

/** GB/s unidireccionales por carril (AGP: ancho de banda total del modo, no por carril). */
export const BUS_BANDWIDTH_GBPS: Record<BusInterface, number> = {
  isa: 0.008,
  pci: 0.133,
  agp_1x: 0.266,
  agp_2x: 0.533,
  agp_4x: 1.066,
  agp_8x: 2.133,
  pcie_1_0: 0.25,
  pcie_2_0: 0.5,
  pcie_3_0: 0.985,
  pcie_4_0: 1.969,
  pcie_5_0: 3.938,
  pcie_6_0: 7.563,
}

export function linkBandwidthGbps(bus: BusInterface, lanes: number): number {
  if (isAgp(bus) || bus === 'pci' || bus === 'isa') return BUS_BANDWIDTH_GBPS[bus]
  return BUS_BANDWIDTH_GBPS[bus] * lanes
}

const STORAGE_RANK: Record<StorageInterface, number> = {
  pata: 1,
  sata1: 2,
  sata2: 3,
  sata3: 4,
  sas: 4,
  nvme_3: 5,
  nvme_4: 6,
  nvme_5: 7,
}

/** Un dispositivo más lento cabe en un controlador más nuevo de la misma familia. */
export function storageFits(device: StorageInterface, board: StorageInterface[]): boolean {
  if (board.includes(device)) return true
  if (device === 'pata' || device === 'sas') return false
  if (device.startsWith('sata')) {
    return board.some((slot) => slot.startsWith('sata') && STORAGE_RANK[slot] >= STORAGE_RANK[device])
  }
  if (device.startsWith('nvme')) {
    return board.some((slot) => slot.startsWith('nvme') && STORAGE_RANK[slot] >= STORAGE_RANK[device])
  }
  return false
}

export function inferVideoEncode(
  manufacturer: string,
  architecture: string,
  year: number,
): 'nvenc' | 'vcn' | 'quicksync' | 'none' {
  const arch = architecture.toLowerCase()
  const brand = manufacturer.toLowerCase()
  if (brand === 'intel' || arch.includes('intel')) {
    if (year >= 2011 || arch.includes('sandy') || arch.includes('quick sync')) return 'quicksync'
    return 'none'
  }
  if (brand === 'nvidia' || brand === 'geforce') {
    if (
      year >= 2012 ||
      /kepler|maxwell|pascal|turing|ampere|ada|blackwell|gtx 6|gtx 7|gtx 9|gtx 10|rtx/.test(arch)
    ) {
      return 'nvenc'
    }
    return 'none'
  }
  if (brand === 'amd' || brand === 'ati') {
    if (/vega|rdna|navi|cdna/.test(arch) || year >= 2017) return 'vcn'
    return 'none'
  }
  return 'none'
}

/** Factor de pico transitorio cuando no hay medición. Estimación por familia, no un dato de laboratorio. */
export function architectureTransientFactor(architecture: string): number {
  const arch = architecture.toLowerCase()
  if (arch.includes('ampere') || arch.includes('ga102') || arch.includes('ga104')) return 1.8
  if (arch.includes('turing')) return 1.45
  if (arch.includes('blackwell') || arch.includes('gb202')) return 1.45
  if (arch.includes('ada') || arch.includes('ad102')) return 1.35
  if (arch.includes('rdna 3') || arch.includes('rdna3')) return 1.45
  if (arch.includes('rdna 4') || arch.includes('rdna4')) return 1.35
  if (arch.includes('rdna 2') || arch.includes('rdna2')) return 1.3
  if (arch.includes('fermi') || arch.includes('gf100')) return 1.3
  if (arch.includes('pascal')) return 1.15
  if (arch.includes('vega') || arch.includes('fiji')) return 1.35
  return 1.2
}
