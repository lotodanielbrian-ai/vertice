import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const sourcePath = resolve(root, 'pc_builder_3d_showcase.tsx')
const outDir = resolve(root, 'packages/db/seed-data')
const source = readFileSync(sourcePath, 'utf8')

const start = source.indexOf('const hardwareDb = ')
const end = source.indexOf('const GPU3DViewer')
if (start < 0 || end < 0) throw new Error('No se encontró hardwareDb en el prototipo')

const chunk = source.slice(start, end)
const { hardwareDb, legendaryPresets } = new Function(
  `${chunk}\nreturn { hardwareDb, legendaryPresets }`,
)()

const warnings = []

const BUS = [
  ['agp 8x', 'agp_8x'],
  ['agp 4x', 'agp_4x'],
  ['agp 2x', 'agp_2x'],
  ['agp 1x', 'agp_1x'],
  ['pcie 6', 'pcie_6_0'],
  ['pcie 5', 'pcie_5_0'],
  ['5.0', 'pcie_5_0'],
  ['pcie 4', 'pcie_4_0'],
  ['4.0', 'pcie_4_0'],
  ['pcie 3', 'pcie_3_0'],
  ['3.0', 'pcie_3_0'],
  ['pcie 2', 'pcie_2_0'],
  ['2.1', 'pcie_2_0'],
  ['2.0', 'pcie_2_0'],
  ['pcie 1', 'pcie_1_0'],
  ['1.1', 'pcie_1_0'],
  ['1.0', 'pcie_1_0'],
]

function parseBus(raw) {
  if (!raw) return null
  const text = String(raw).toLowerCase()
  for (const [needle, value] of BUS) {
    if (text.includes(needle)) return value
  }
  warnings.push(`Bus no reconocido: "${raw}"`)
  return null
}

const VRAM_TYPES = ['HBM3', 'HBM2', 'HBM', 'GDDR7', 'GDDR6X', 'GDDR5X', 'GDDR6', 'GDDR5', 'GDDR4', 'GDDR3', 'GDDR2', 'GDDR', 'DDR', 'SDR']

function parseVram(raw) {
  if (!raw) return { vramMb: null, vramType: null, memoryBusWidthBits: null, memoryBandwidthGbps: null }
  const text = String(raw)
  const cap = text.match(/(\d+(?:\.\d+)?)\s*(MB|GB)/i)
  let vramMb = null
  if (cap) {
    vramMb = cap[2].toUpperCase() === 'GB' ? Math.round(parseFloat(cap[1]) * 1024) : Math.round(parseFloat(cap[1]))
  } else {
    warnings.push(`VRAM sin capacidad: "${raw}"`)
  }
  const upper = text.toUpperCase()
  const vramType = VRAM_TYPES.find((type) => upper.includes(type)) ?? null
  if (!vramType) warnings.push(`VRAM sin tipo: "${raw}"`)
  const bus = text.match(/(\d+)\s*-?\s*bit/i)
  const bw = text.match(/(\d+(?:\.\d+)?)\s*TB\/s/i)
  return {
    vramMb,
    vramType,
    memoryBusWidthBits: bus ? Number(bus[1]) : null,
    memoryBandwidthGbps: bw ? Math.round(parseFloat(bw[1]) * 1024 * 100) / 100 : null,
  }
}

function parseRamGen(raw) {
  const text = String(raw ?? '').toLowerCase()
  if (text.includes('ddr5')) return 'ddr5'
  if (text.includes('ddr4')) return 'ddr4'
  if (text.includes('ddr3')) return 'ddr3'
  if (text.includes('ddr2')) return 'ddr2'
  if (text.includes('ddr')) return 'ddr'
  if (text.includes('sdr')) return 'sdr'
  warnings.push(`Generación de RAM no reconocida: "${raw}"`)
  return null
}

function parseCapacityMb(raw) {
  const match = String(raw ?? '').match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i)
  if (!match) return null
  const n = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'TB') return Math.round(n * 1024 * 1024)
  if (unit === 'GB') return Math.round(n * 1024)
  return Math.round(n)
}

const KNOWN_CPU = {
  c_9800x3d: { architecture: 'Zen 5', lithographyNm: 4, baseClockMhz: 4700, boostClockMhz: 5200, l3CacheKb: 98304, peak: 162, ipc: 2.05, isa: ['AVX2', 'AVX-512'] },
  c_7800x3d: { architecture: 'Zen 4', lithographyNm: 5, baseClockMhz: 4200, boostClockMhz: 5000, l3CacheKb: 98304, peak: 162, ipc: 1.9, isa: ['AVX2', 'AVX-512'] },
  c_14900k: { architecture: 'Raptor Lake', lithographyNm: 10, baseClockMhz: 3200, boostClockMhz: 6000, l3CacheKb: 36864, peak: 253, ipc: 1.8, isa: ['AVX2'], pCores: 8, eCores: 16 },
  c_13600k: { architecture: 'Raptor Lake', lithographyNm: 10, baseClockMhz: 3500, boostClockMhz: 5100, l3CacheKb: 24576, peak: 181, ipc: 1.75, isa: ['AVX2'], pCores: 6, eCores: 8 },
  c_7600x: { architecture: 'Zen 4', lithographyNm: 5, baseClockMhz: 4700, boostClockMhz: 5300, l3CacheKb: 32768, peak: 142, ipc: 1.85, isa: ['AVX2', 'AVX-512'] },
  c_5800x3d: { architecture: 'Zen 3', lithographyNm: 7, baseClockMhz: 3400, boostClockMhz: 4500, l3CacheKb: 98304, peak: 142, ipc: 1.75, isa: ['AVX2'] },
  c_5600x: { architecture: 'Zen 3', lithographyNm: 7, baseClockMhz: 3700, boostClockMhz: 4600, l3CacheKb: 32768, peak: 88, ipc: 1.75, isa: ['AVX2'] },
  c_12400f: { architecture: 'Alder Lake', lithographyNm: 10, baseClockMhz: 2500, boostClockMhz: 4400, l3CacheKb: 18432, peak: 117, ipc: 1.7, isa: ['AVX2'], pCores: 6, eCores: 0 },
  c_2600k: { architecture: 'Sandy Bridge', lithographyNm: 32, baseClockMhz: 3400, boostClockMhz: 3800, l3CacheKb: 8192, peak: 95, ipc: 1.35, isa: ['AVX'] },
  c_q6600: { architecture: 'Core', lithographyNm: 65, baseClockMhz: 2400, boostClockMhz: 2400, l3CacheKb: 8192, peak: 105, ipc: 1, isa: ['SSE3'] },
  c_athlon64: { architecture: 'K8', lithographyNm: 130, baseClockMhz: 2200, boostClockMhz: 2200, l3CacheKb: 512, peak: 67, ipc: 0.75, isa: ['SSE2'] },
}

const YEARS = {
  mb_z790: 2022, mb_x670e: 2022, mb_b650: 2022, mb_b550: 2020, mb_retro775: 2007,
  r_ddr5_64: 2024, r_ddr5_32: 2022, r_ddr4_32: 2020, r_ddr4_16: 2016, r_ddr2_4: 2006,
  cl_aio360: 2023, cl_nhd15: 2014, cl_ak620: 2022, cl_ag400: 2022, cl_stock: 2006,
  st_gen5: 2023, st_gen4_2t: 2022, st_gen4_1t: 2022, st_sata: 2020, st_hdd: 2016,
  cs_o11: 2023, cs_h7flow: 2022, cs_4000d: 2020, cs_retro: 2001,
  ps_1200: 2023, ps_1000: 2023, ps_850: 2023, ps_650: 2021, ps_500: 2018, ps_300: 2004,
}

const CHIPSET = {
  mb_z790: 'Z790', mb_x670e: 'X670E', mb_b650: 'B650', mb_b550: 'B550', mb_retro775: 'P35',
}

function base(row, type) {
  return {
    slug: row.id,
    name: row.name,
    manufacturer: row.brand ?? manufacturerFromName(row.name),
    type,
    releaseYear: row.year ?? YEARS[row.id] ?? null,
    priceUsd: row.price ?? null,
    baseTier: row.tier ?? 'C',
    tdpWatts: row.tdp ?? 0,
    performanceScore: row.score ?? null,
  }
}

function manufacturerFromName(name) {
  if (/asus/i.test(name)) return 'ASUS'
  if (/msi/i.test(name)) return 'MSI'
  if (/gigabyte/i.test(name)) return 'Gigabyte'
  if (/g\.skill/i.test(name)) return 'G.Skill'
  if (/corsair/i.test(name)) return 'Corsair'
  if (/kingston/i.test(name)) return 'Kingston'
  if (/lian li/i.test(name)) return 'Lian Li'
  if (/noctua/i.test(name)) return 'Noctua'
  if (/deepcool/i.test(name)) return 'DeepCool'
  if (/crucial/i.test(name)) return 'Crucial'
  if (/samsung/i.test(name)) return 'Samsung'
  if (/wd_/i.test(name) || /western/i.test(name)) return 'Western Digital'
  if (/seagate/i.test(name)) return 'Seagate'
  if (/nzxt/i.test(name)) return 'NZXT'
  if (/cooler master/i.test(name)) return 'Cooler Master'
  if (/evga/i.test(name)) return 'EVGA'
  if (/seasonic/i.test(name)) return 'Seasonic'
  return 'Genérico'
}

const components = []

for (const row of hardwareDb.gpu) {
  const vram = parseVram(row.vram)
  const busInterface = parseBus(row.pcie)
  if (row.lengthMm == null) warnings.push(`${row.id}: largo de GPU ausente`)
  components.push({
    ...base(row, 'gpu'),
    tdpWatts: row.tdp ?? 0,
    performanceScore: row.score ?? 0,
    gpu: {
      architecture: row.architecture ?? 'unknown',
      busInterface,
      busLanes: null,
      lithographyNm: null,
      baseClockMhz: null,
      boostClockMhz: null,
      shaderCores: null,
      vramType: vram.vramType,
      vramMb: vram.vramMb,
      memoryBusWidthBits: vram.memoryBusWidthBits,
      memoryBandwidthGbps: vram.memoryBandwidthGbps,
      lengthMm: row.lengthMm ?? null,
      heightMm: null,
      slotWidth: null,
      powerConnectors: null,
      recommendedPsuWatts: null,
      peakTransientSpikeWatts: null,
      directxMax: null,
      vulkan: (row.year ?? 0) >= 2016,
      visual: {
        form: row.form ?? 'dual',
        fans: row.fans ?? 0,
        color: row.color ?? 0x18181b,
        accentColor: row.accentColor ?? 0x22d3ee,
      },
    },
  })
}

warnings.push(
  `GPUs del prototipo (${hardwareDb.gpu.length}): bus_lanes, conectores de alimentación, relojes, litografía, alto y DirectX quedan NULL. No se inventan.`,
)

for (const row of hardwareDb.cpu) {
  const known = KNOWN_CPU[row.id]
  if (!known) warnings.push(`${row.id}: sin ficha pública complementaria`)
  const ramGen = parseRamGen(row.ramGen)
  components.push({
    ...base(row, 'cpu'),
    performanceScore: row.score ?? 0,
    cpu: {
      socketName: row.socket,
      architecture: known?.architecture ?? 'unknown',
      lithographyNm: known?.lithographyNm ?? null,
      cores: row.cores,
      threads: row.threads,
      performanceCores: known?.pCores ?? row.cores,
      efficiencyCores: known?.eCores ?? 0,
      baseClockMhz: known?.baseClockMhz ?? null,
      boostClockMhz: known?.boostClockMhz ?? null,
      l1CacheKb: 0,
      l2CacheKb: 0,
      l3CacheKb: known?.l3CacheKb ?? 0,
      maxRamGen: ramGen,
      maxMemoryChannels: 2,
      integratedGraphics: row.id.endsWith('f') ? null : null,
      peakTransientTdpWatts: known?.peak ?? null,
      instructionSets: known?.isa ?? [],
      ipcIndex: known?.ipc ?? null,
    },
  })
}

const BOARD_STORAGE = {
  mb_retro775: ['pata', 'sata2'],
  mb_b550: ['sata3', 'nvme_4'],
  mb_b650: ['sata3', 'nvme_4', 'nvme_5'],
  mb_x670e: ['sata3', 'nvme_4', 'nvme_5'],
  mb_z790: ['sata3', 'nvme_4', 'nvme_5'],
}

for (const row of hardwareDb.motherboard) {
  const bus = parseBus(row.pcieVer)
  components.push({
    ...base(row, 'motherboard'),
    tdpWatts: 0,
    performanceScore: bus === 'pcie_5_0' ? 80 : bus === 'pcie_4_0' ? 60 : 25,
    motherboard: {
      socketName: row.socket,
      chipsetName: CHIPSET[row.id] ?? row.name,
      formFactor: String(row.format ?? 'ATX').toLowerCase() === 'atx' ? 'atx' : 'atx',
      ramGen: parseRamGen(row.ramGen),
      ramSlots: 4,
      m2Slots: row.m2Slots ?? 0,
      pcieSlot: bus && bus.startsWith('pcie') ? bus : null,
      pcieLanes: bus && bus.startsWith('pcie') ? 16 : null,
      agpSlot: null,
      storageInterfaces: BOARD_STORAGE[row.id] ?? ['sata3'],
    },
  })
}

for (const row of hardwareDb.ram) {
  const gen = parseRamGen(row.gen)
  const capacityMb = parseCapacityMb(row.capacity)
  const modules = /\(2x/i.test(row.name) ? 2 : 1
  const cas = row.name.match(/CL(\d+)/i)
  components.push({
    ...base(row, 'ram'),
    tdpWatts: 0,
    performanceScore: ((row.mhz ?? 0) * ((capacityMb ?? 0) / 1024)) / 80,
    ram: {
      gen,
      capacityMb,
      modules,
      mhz: row.mhz,
      cas: cas ? Number(cas[1]) : null,
      voltage: gen === 'ddr5' ? 1.35 : gen === 'ddr4' ? 1.35 : gen === 'ddr2' ? 1.8 : null,
    },
  })
}

const COOLER_SOCKETS = {
  cl_aio360: ['AM5', 'AM4', 'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155'],
  cl_nhd15: ['AM5', 'AM4', 'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156'],
  cl_ak620: ['AM5', 'AM4', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156'],
  cl_ag400: ['AM5', 'AM4', 'LGA1700', 'LGA1200', 'LGA1151'],
  cl_stock: ['LGA775', 'Socket 939', 'AM2', 'AM3', 'AM4', 'LGA1150', 'LGA1151', 'LGA1155', 'LGA1200', 'LGA1700'],
}
const COOLER_HEIGHT = { cl_aio360: null, cl_nhd15: 165, cl_ak620: 160, cl_ag400: 150, cl_stock: 60 }

for (const row of hardwareDb.cooler) {
  components.push({
    ...base(row, 'cooler'),
    tdpWatts: row.type === 'liquid' ? 8 : 3,
    performanceScore: (row.tdpMax ?? 0) / 4,
    cooler: {
      tdpMax: row.tdpMax,
      coolerType: row.type,
      maxRpm: row.fanRpm,
      noiseDb: row.noiseDb ?? null,
      heightMm: COOLER_HEIGHT[row.id] ?? null,
      socketNames: COOLER_SOCKETS[row.id] ?? [],
    },
  })
}

function storageInterface(type) {
  if (/gen5/i.test(type)) return 'nvme_5'
  if (/gen4/i.test(type)) return 'nvme_4'
  if (/nvme/i.test(type)) return 'nvme_3'
  if (/sata/i.test(type)) return 'sata3'
  if (/hdd/i.test(type)) return 'sata3'
  return null
}

for (const row of hardwareDb.storage) {
  const iface = storageInterface(row.type)
  components.push({
    ...base(row, 'storage'),
    tdpWatts: 0,
    performanceScore: (row.speedMb ?? 0) / 100,
    storage: {
      interface: iface,
      capacityMb: parseCapacityMb(row.capacity),
      readMbS: row.speedMb ?? null,
      kind: /hdd/i.test(row.type) ? 'hdd' : 'ssd',
    },
  })
}

const CASE_META = {
  cs_o11: { forms: ['atx', 'micro_atx', 'mini_itx'], rad: [360], fans: 10, psu: 'atx' },
  cs_h7flow: { forms: ['atx', 'micro_atx', 'mini_itx'], rad: [360], fans: 7, psu: 'atx' },
  cs_4000d: { forms: ['atx', 'micro_atx', 'mini_itx'], rad: [280], fans: 6, psu: 'atx' },
  cs_retro: { forms: ['atx', 'micro_atx'], rad: [], fans: 2, psu: 'atx' },
}

for (const row of hardwareDb.case) {
  const meta = CASE_META[row.id]
  components.push({
    ...base(row, 'case'),
    tdpWatts: 0,
    performanceScore: row.airflowScore ?? 0,
    case: {
      supportedFormFactors: meta?.forms ?? ['atx'],
      maxGpuLengthMm: row.maxGpuLen,
      maxCoolerHeightMm: row.maxCoolerHeight,
      radiatorSupportMm: meta?.rad ?? [],
      fanSlots: meta?.fans ?? 3,
      airflowScore: row.airflowScore ?? 50,
      psuFormFactor: meta?.psu ?? 'atx',
    },
  })
}

for (const row of hardwareDb.psu) {
  const atx3 = /atx\s*3/i.test(row.name)
  components.push({
    ...base(row, 'psu'),
    tdpWatts: 0,
    performanceScore: (row.wattage ?? 0) / 10,
    psu: {
      wattage: row.wattage,
      formFactor: 'atx',
      modular: null,
      efficiency: row.rating ?? 'unknown',
      atxVersion: atx3 ? 3 : row.id === 'ps_300' ? 1.3 : 2.4,
      rail12vAmps: null,
      rail5vAmps: null,
      rail33vAmps: null,
      connectors: null,
      topology: row.id === 'ps_300' ? 'group' : null,
      has12vhpwr: row.pcie12v === true,
    },
  })
}

for (const preset of legendaryPresets) {
  const cpuRow = preset.build.cpu
  const board = preset.build.motherboard
  const ram = preset.build.ram
  if (cpuRow && board && cpuRow.socket !== board.socket) {
    warnings.push(
      `Preset inconsistente "${preset.title}": CPU ${cpuRow.socket} con placa ${board.socket} (${board.id}).`,
    )
  }
  if (ram && board && parseRamGen(ram.gen) !== parseRamGen(board.ramGen)) {
    warnings.push(
      `Preset inconsistente "${preset.title}": RAM ${ram.gen} con placa ${board.ramGen} (${board.id}).`,
    )
  }
}

const missingYear = components.filter((row) => !row.releaseYear).map((row) => row.slug)
if (missingYear.length) warnings.push(`Sin año: ${missingYear.join(', ')}`)

mkdirSync(outDir, { recursive: true })
writeFileSync(resolve(outDir, 'prototype.json'), JSON.stringify({ components }, null, 2))
writeFileSync(resolve(outDir, 'extract-warnings.json'), JSON.stringify(warnings, null, 2))
console.log(`Extraídos ${components.length} componentes. Advertencias: ${warnings.length}`)
