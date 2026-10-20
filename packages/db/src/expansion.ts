import type {
  BoardFormFactor,
  BusInterface,
  CatalogItem,
  RamGen,
  StorageInterface,
  Tier,
} from '@pc/shared'

type SeedItem = Omit<CatalogItem, 'id'>

interface CpuRow {
  slug: string
  name: string
  manufacturer: string
  year: number
  price: number
  tier: Tier
  tdp: number
  score: number
  socket: string
  architecture: string
  nm: number
  cores: number
  threads: number
  pCores?: number
  eCores?: number
  base: number
  boost: number
  l3: number
  ram: RamGen
  channels?: number
  igpu?: string | null
  peak: number
  isa: string[]
  ipc: number
}

const CPUS: CpuRow[] = [
  { slug: 'c_p3_866', name: 'Intel Pentium III 866', manufacturer: 'Intel', year: 2000, price: 8, tier: 'F', tdp: 26, score: 3, socket: 'Socket 370', architecture: 'Coppermine', nm: 180, cores: 1, threads: 1, base: 866, boost: 866, l3: 0, ram: 'sdr', channels: 1, peak: 26, isa: ['MMX', 'SSE'], ipc: 0.55 },
  { slug: 'c_athlonxp_3200', name: 'AMD Athlon XP 3200+', manufacturer: 'AMD', year: 2003, price: 10, tier: 'F', tdp: 76, score: 5, socket: 'Socket A', architecture: 'Barton', nm: 130, cores: 1, threads: 1, base: 2200, boost: 2200, l3: 0, ram: 'ddr', channels: 1, peak: 76, isa: ['MMX', 'SSE', '3DNow!'], ipc: 0.7 },
  { slug: 'c_p4_3ht', name: 'Intel Pentium 4 3.0 GHz HT', manufacturer: 'Intel', year: 2003, price: 12, tier: 'F', tdp: 82, score: 7, socket: 'Socket 478', architecture: 'Northwood', nm: 130, cores: 1, threads: 2, base: 3000, boost: 3000, l3: 0, ram: 'ddr', channels: 2, peak: 82, isa: ['SSE2'], ipc: 0.45 },
  { slug: 'c_fx57', name: 'AMD Athlon 64 FX-57', manufacturer: 'AMD', year: 2005, price: 25, tier: 'D', tdp: 104, score: 9, socket: 'Socket 939', architecture: 'San Diego', nm: 90, cores: 1, threads: 1, base: 2800, boost: 2800, l3: 1024, ram: 'ddr', channels: 2, peak: 104, isa: ['SSE2', 'SSE3'], ipc: 0.8 },
  { slug: 'c_e8400', name: 'Intel Core 2 Duo E8400', manufacturer: 'Intel', year: 2008, price: 18, tier: 'D', tdp: 65, score: 16, socket: 'LGA775', architecture: 'Wolfdale', nm: 45, cores: 2, threads: 2, base: 3000, boost: 3000, l3: 6144, ram: 'ddr2', peak: 65, isa: ['SSE4.1'], ipc: 1.15 },
  { slug: 'c_phenom_9950', name: 'AMD Phenom X4 9950', manufacturer: 'AMD', year: 2008, price: 20, tier: 'D', tdp: 140, score: 18, socket: 'AM2+', architecture: 'Agena', nm: 65, cores: 4, threads: 4, base: 2600, boost: 2600, l3: 2048, ram: 'ddr2', peak: 140, isa: ['SSE3'], ipc: 0.85 },
  { slug: 'c_i7_920', name: 'Intel Core i7-920', manufacturer: 'Intel', year: 2008, price: 28, tier: 'D', tdp: 130, score: 22, socket: 'LGA1366', architecture: 'Nehalem', nm: 45, cores: 4, threads: 8, base: 2667, boost: 2933, l3: 8192, ram: 'ddr3', channels: 3, igpu: null, peak: 130, isa: ['SSE4.2'], ipc: 1.15 },
  { slug: 'c_phenom_ii_965', name: 'AMD Phenom II X4 965', manufacturer: 'AMD', year: 2009, price: 22, tier: 'D', tdp: 125, score: 24, socket: 'AM3', architecture: 'Deneb', nm: 45, cores: 4, threads: 4, base: 3400, boost: 3400, l3: 6144, ram: 'ddr3', peak: 125, isa: ['SSE3'], ipc: 0.95 },
  { slug: 'c_3770k', name: 'Intel Core i7-3770K', manufacturer: 'Intel', year: 2012, price: 45, tier: 'D', tdp: 77, score: 36, socket: 'LGA1155', architecture: 'Ivy Bridge', nm: 22, cores: 4, threads: 8, base: 3500, boost: 3900, l3: 8192, ram: 'ddr3', igpu: 'HD Graphics 4000', peak: 77, isa: ['AVX'], ipc: 1.45 },
  { slug: 'c_fx8350', name: 'AMD FX-8350', manufacturer: 'AMD', year: 2012, price: 35, tier: 'D', tdp: 125, score: 32, socket: 'AM3+', architecture: 'Piledriver', nm: 32, cores: 8, threads: 8, base: 4000, boost: 4200, l3: 8192, ram: 'ddr3', peak: 125, isa: ['AVX', 'SSE4.2'], ipc: 0.7 },
  { slug: 'c_4790k', name: 'Intel Core i7-4790K', manufacturer: 'Intel', year: 2014, price: 55, tier: 'C', tdp: 88, score: 42, socket: 'LGA1150', architecture: 'Haswell', nm: 22, cores: 4, threads: 8, base: 4000, boost: 4400, l3: 8192, ram: 'ddr3', igpu: 'HD Graphics 4600', peak: 88, isa: ['AVX2'], ipc: 1.5 },
  { slug: 'c_6700k', name: 'Intel Core i7-6700K', manufacturer: 'Intel', year: 2015, price: 70, tier: 'C', tdp: 91, score: 48, socket: 'LGA1151', architecture: 'Skylake', nm: 14, cores: 4, threads: 8, base: 4000, boost: 4200, l3: 8192, ram: 'ddr4', igpu: 'HD Graphics 530', peak: 91, isa: ['AVX2'], ipc: 1.55 },
  { slug: 'c_1800x', name: 'AMD Ryzen 7 1800X', manufacturer: 'AMD', year: 2017, price: 80, tier: 'C', tdp: 95, score: 52, socket: 'AM4', architecture: 'Zen', nm: 14, cores: 8, threads: 16, base: 3600, boost: 4000, l3: 16384, ram: 'ddr4', peak: 95, isa: ['AVX2'], ipc: 1.4 },
  { slug: 'c_8700k', name: 'Intel Core i7-8700K', manufacturer: 'Intel', year: 2017, price: 110, tier: 'B', tdp: 95, score: 58, socket: 'LGA1151', architecture: 'Coffee Lake', nm: 14, cores: 6, threads: 12, base: 3700, boost: 4700, l3: 12288, ram: 'ddr4', igpu: 'UHD Graphics 630', peak: 95, isa: ['AVX2'], ipc: 1.6 },
  { slug: 'c_2700x', name: 'AMD Ryzen 7 2700X', manufacturer: 'AMD', year: 2018, price: 90, tier: 'B', tdp: 105, score: 60, socket: 'AM4', architecture: 'Zen+', nm: 12, cores: 8, threads: 16, base: 3700, boost: 4300, l3: 16384, ram: 'ddr4', peak: 105, isa: ['AVX2'], ipc: 1.48 },
  { slug: 'c_9900k', name: 'Intel Core i9-9900K', manufacturer: 'Intel', year: 2018, price: 160, tier: 'B', tdp: 95, score: 66, socket: 'LGA1151', architecture: 'Coffee Lake', nm: 14, cores: 8, threads: 16, base: 3600, boost: 5000, l3: 16384, ram: 'ddr4', igpu: 'UHD Graphics 630', peak: 95, isa: ['AVX2'], ipc: 1.6 },
  { slug: 'c_3900x', name: 'AMD Ryzen 9 3900X', manufacturer: 'AMD', year: 2019, price: 180, tier: 'A', tdp: 105, score: 74, socket: 'AM4', architecture: 'Zen 2', nm: 7, cores: 12, threads: 24, base: 3800, boost: 4600, l3: 65536, ram: 'ddr4', peak: 142, isa: ['AVX2'], ipc: 1.6 },
  { slug: 'c_10900k', name: 'Intel Core i9-10900K', manufacturer: 'Intel', year: 2020, price: 200, tier: 'A', tdp: 125, score: 72, socket: 'LGA1200', architecture: 'Comet Lake', nm: 14, cores: 10, threads: 20, base: 3700, boost: 5300, l3: 20480, ram: 'ddr4', igpu: 'UHD Graphics 630', peak: 250, isa: ['AVX2'], ipc: 1.6 },
  { slug: 'c_5900x', name: 'AMD Ryzen 9 5900X', manufacturer: 'AMD', year: 2020, price: 220, tier: 'A', tdp: 105, score: 86, socket: 'AM4', architecture: 'Zen 3', nm: 7, cores: 12, threads: 24, base: 3700, boost: 4800, l3: 65536, ram: 'ddr4', peak: 142, isa: ['AVX2'], ipc: 1.8 },
  { slug: 'c_11900k', name: 'Intel Core i9-11900K', manufacturer: 'Intel', year: 2021, price: 180, tier: 'A', tdp: 125, score: 76, socket: 'LGA1200', architecture: 'Rocket Lake', nm: 14, cores: 8, threads: 16, base: 3500, boost: 5300, l3: 16384, ram: 'ddr4', igpu: 'UHD Graphics 750', peak: 251, isa: ['AVX-512'], ipc: 1.7 },
  { slug: 'c_12900k', name: 'Intel Core i9-12900K', manufacturer: 'Intel', year: 2021, price: 280, tier: 'S', tdp: 125, score: 92, socket: 'LGA1700', architecture: 'Alder Lake', nm: 10, cores: 16, threads: 24, pCores: 8, eCores: 8, base: 3200, boost: 5200, l3: 30720, ram: 'ddr5', igpu: 'UHD Graphics 770', peak: 241, isa: ['AVX2'], ipc: 1.75 },
  { slug: 'c_7700x', name: 'AMD Ryzen 7 7700X', manufacturer: 'AMD', year: 2022, price: 240, tier: 'A', tdp: 105, score: 88, socket: 'AM5', architecture: 'Zen 4', nm: 5, cores: 8, threads: 16, base: 4500, boost: 5400, l3: 32768, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 142, isa: ['AVX-512'], ipc: 1.9 },
  { slug: 'c_13900k', name: 'Intel Core i9-13900K', manufacturer: 'Intel', year: 2022, price: 420, tier: 'S', tdp: 125, score: 96, socket: 'LGA1700', architecture: 'Raptor Lake', nm: 10, cores: 24, threads: 32, pCores: 8, eCores: 16, base: 3000, boost: 5800, l3: 36864, ram: 'ddr5', igpu: 'UHD Graphics 770', peak: 253, isa: ['AVX2'], ipc: 1.8 },
  { slug: 'c_7950x', name: 'AMD Ryzen 9 7950X', manufacturer: 'AMD', year: 2022, price: 450, tier: 'S', tdp: 170, score: 100, socket: 'AM5', architecture: 'Zen 4', nm: 5, cores: 16, threads: 32, base: 4500, boost: 5700, l3: 65536, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 230, isa: ['AVX-512'], ipc: 1.9 },
  { slug: 'c_155h', name: 'Intel Core Ultra 7 155H', manufacturer: 'Intel', year: 2023, price: 320, tier: 'A', tdp: 28, score: 78, socket: 'BGA2049', architecture: 'Meteor Lake', nm: 7, cores: 16, threads: 22, pCores: 6, eCores: 10, base: 1400, boost: 4800, l3: 24576, ram: 'ddr5', igpu: 'Arc Graphics', peak: 115, isa: ['AVX2'], ipc: 1.7 },
  { slug: 'c_9700x', name: 'AMD Ryzen 7 9700X', manufacturer: 'AMD', year: 2024, price: 320, tier: 'S', tdp: 65, score: 99, socket: 'AM5', architecture: 'Zen 5', nm: 4, cores: 8, threads: 16, base: 3800, boost: 5500, l3: 32768, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 88, isa: ['AVX-512'], ipc: 2.05 },
  { slug: 'c_9950x', name: 'AMD Ryzen 9 9950X', manufacturer: 'AMD', year: 2024, price: 580, tier: 'S', tdp: 170, score: 108, socket: 'AM5', architecture: 'Zen 5', nm: 4, cores: 16, threads: 32, base: 4300, boost: 5700, l3: 65536, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 230, isa: ['AVX-512'], ipc: 2.05 },
  { slug: 'c_285k', name: 'Intel Core Ultra 9 285K', manufacturer: 'Intel', year: 2024, price: 589, tier: 'S', tdp: 125, score: 110, socket: 'LGA1851', architecture: 'Arrow Lake', nm: 3, cores: 24, threads: 24, pCores: 8, eCores: 16, base: 3700, boost: 5700, l3: 36864, ram: 'ddr5', igpu: 'Arc Graphics', peak: 250, isa: ['AVX2'], ipc: 2 },
  { slug: 'c_5700x3d', name: 'AMD Ryzen 7 5700X3D', manufacturer: 'AMD', year: 2024, price: 249, tier: 'A', tdp: 105, score: 76, socket: 'AM4', architecture: 'Zen 3', nm: 7, cores: 8, threads: 16, base: 3000, boost: 4100, l3: 98304, ram: 'ddr4', igpu: null, peak: 142, isa: ['AVX2'], ipc: 1.75 },
  { slug: 'c_7600', name: 'AMD Ryzen 5 7600', manufacturer: 'AMD', year: 2023, price: 229, tier: 'A', tdp: 65, score: 76, socket: 'AM5', architecture: 'Zen 4', nm: 5, cores: 6, threads: 12, base: 3800, boost: 5100, l3: 32768, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 88, isa: ['AVX2', 'AVX-512'], ipc: 1.85 },
  { slug: 'c_9600x', name: 'AMD Ryzen 5 9600X', manufacturer: 'AMD', year: 2024, price: 279, tier: 'S', tdp: 65, score: 90, socket: 'AM5', architecture: 'Zen 5', nm: 4, cores: 6, threads: 12, base: 3900, boost: 5400, l3: 32768, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 88, isa: ['AVX2', 'AVX-512'], ipc: 2 },
  { slug: 'c_7900x', name: 'AMD Ryzen 9 7900X', manufacturer: 'AMD', year: 2022, price: 549, tier: 'S', tdp: 170, score: 93, socket: 'AM5', architecture: 'Zen 4', nm: 5, cores: 12, threads: 24, base: 4700, boost: 5600, l3: 65536, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 230, isa: ['AVX2', 'AVX-512'], ipc: 1.9 },
  { slug: 'c_9900x', name: 'AMD Ryzen 9 9900X', manufacturer: 'AMD', year: 2024, price: 499, tier: 'S', tdp: 120, score: 103, socket: 'AM5', architecture: 'Zen 5', nm: 4, cores: 12, threads: 24, base: 4400, boost: 5600, l3: 65536, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 162, isa: ['AVX2', 'AVX-512'], ipc: 2.05 },
  { slug: 'c_9950x3d', name: 'AMD Ryzen 9 9950X3D', manufacturer: 'AMD', year: 2025, price: 699, tier: 'S', tdp: 170, score: 112, socket: 'AM5', architecture: 'Zen 5', nm: 4, cores: 16, threads: 32, base: 4300, boost: 5700, l3: 131072, ram: 'ddr5', igpu: 'Radeon Graphics', peak: 230, isa: ['AVX2', 'AVX-512'], ipc: 2.05 },
  { slug: 'c_12600k', name: 'Intel Core i5-12600K', manufacturer: 'Intel', year: 2021, price: 289, tier: 'B', tdp: 125, score: 70, socket: 'LGA1700', architecture: 'Alder Lake', nm: 10, cores: 10, threads: 16, pCores: 6, eCores: 4, base: 3700, boost: 4900, l3: 20480, ram: 'ddr5', igpu: 'UHD Graphics 770', peak: 150, isa: ['AVX2'], ipc: 1.7 },
  { slug: 'c_13400f', name: 'Intel Core i5-13400F', manufacturer: 'Intel', year: 2023, price: 196, tier: 'B', tdp: 65, score: 66, socket: 'LGA1700', architecture: 'Raptor Lake', nm: 10, cores: 10, threads: 16, pCores: 6, eCores: 4, base: 2500, boost: 4600, l3: 20480, ram: 'ddr5', igpu: null, peak: 148, isa: ['AVX2'], ipc: 1.7 },
  { slug: 'c_14600k', name: 'Intel Core i5-14600K', manufacturer: 'Intel', year: 2023, price: 319, tier: 'A', tdp: 125, score: 86, socket: 'LGA1700', architecture: 'Raptor Lake', nm: 10, cores: 14, threads: 20, pCores: 6, eCores: 8, base: 3500, boost: 5300, l3: 24576, ram: 'ddr5', igpu: 'UHD Graphics 770', peak: 181, isa: ['AVX2'], ipc: 1.75 },
  { slug: 'c_14700k', name: 'Intel Core i7-14700K', manufacturer: 'Intel', year: 2023, price: 409, tier: 'S', tdp: 125, score: 94, socket: 'LGA1700', architecture: 'Raptor Lake', nm: 10, cores: 20, threads: 28, pCores: 8, eCores: 12, base: 3400, boost: 5600, l3: 33792, ram: 'ddr5', igpu: 'UHD Graphics 770', peak: 253, isa: ['AVX2'], ipc: 1.8 },
  { slug: 'c_245k', name: 'Intel Core Ultra 5 245K', manufacturer: 'Intel', year: 2024, price: 309, tier: 'A', tdp: 125, score: 88, socket: 'LGA1851', architecture: 'Arrow Lake', nm: 3, cores: 14, threads: 14, pCores: 6, eCores: 8, base: 4200, boost: 5200, l3: 24576, ram: 'ddr5', igpu: 'Arc Graphics', peak: 159, isa: ['AVX2'], ipc: 1.95 },
  { slug: 'c_265k', name: 'Intel Core Ultra 7 265K', manufacturer: 'Intel', year: 2024, price: 394, tier: 'S', tdp: 125, score: 102, socket: 'LGA1851', architecture: 'Arrow Lake', nm: 3, cores: 20, threads: 20, pCores: 8, eCores: 12, base: 3900, boost: 5500, l3: 30720, ram: 'ddr5', igpu: 'Arc Graphics', peak: 250, isa: ['AVX2'], ipc: 2 },
]

function cpuItem(row: CpuRow): SeedItem {
  return {
    slug: row.slug,
    name: row.name,
    manufacturer: row.manufacturer,
    type: 'cpu',
    releaseYear: row.year,
    priceUsd: row.price,
    baseTier: row.tier,
    tdpWatts: row.tdp,
    performanceScore: row.score,
    cpu: {
      socketName: row.socket,
      architecture: row.architecture,
      lithographyNm: row.nm,
      cores: row.cores,
      threads: row.threads,
      performanceCores: row.pCores ?? row.cores,
      efficiencyCores: row.eCores ?? 0,
      baseClockMhz: row.base,
      boostClockMhz: row.boost,
      l1CacheKb: 0,
      l2CacheKb: 0,
      l3CacheKb: row.l3,
      maxRamGen: row.ram,
      maxMemoryChannels: row.channels ?? 2,
      integratedGraphics: row.igpu === undefined ? null : row.igpu,
      peakTransientTdpWatts: row.peak,
      instructionSets: row.isa,
      ipcIndex: row.ipc,
    },
  }
}

interface BoardRow {
  slug: string
  name: string
  manufacturer: string
  year: number
  price: number
  tier: Tier
  socket: string
  chipset: string
  form: BoardFormFactor
  ram: RamGen
  slots: number
  m2: number
  pcie: BusInterface | null
  lanes: number | null
  agp: BusInterface | null
  storage: StorageInterface[]
  score: number
}

const BOARDS: BoardRow[] = [
  { slug: 'mb_440bx', name: 'ASUS P3B-F (440BX)', manufacturer: 'ASUS', year: 1999, price: 15, tier: 'F', socket: 'Socket 370', chipset: 'Intel 440BX', form: 'atx', ram: 'sdr', slots: 4, m2: 0, pcie: null, lanes: null, agp: 'agp_2x', storage: ['pata'], score: 8 },
  { slug: 'mb_nforce2', name: 'ASUS A7N8X Deluxe', manufacturer: 'ASUS', year: 2002, price: 18, tier: 'F', socket: 'Socket A', chipset: 'nForce2', form: 'atx', ram: 'ddr', slots: 3, m2: 0, pcie: null, lanes: null, agp: 'agp_8x', storage: ['pata'], score: 12 },
  { slug: 'mb_p4p800', name: 'ASUS P4P800 (865PE)', manufacturer: 'ASUS', year: 2003, price: 20, tier: 'F', socket: 'Socket 478', chipset: 'Intel 865PE', form: 'atx', ram: 'ddr', slots: 4, m2: 0, pcie: null, lanes: null, agp: 'agp_8x', storage: ['pata', 'sata1'], score: 14 },
  { slug: 'mb_a8v', name: 'ASUS A8V Deluxe', manufacturer: 'ASUS', year: 2004, price: 25, tier: 'D', socket: 'Socket 939', chipset: 'K8T800', form: 'atx', ram: 'ddr', slots: 4, m2: 0, pcie: null, lanes: null, agp: 'agp_8x', storage: ['pata', 'sata1'], score: 16 },
  { slug: 'mb_m2n', name: 'ASUS M2N32-SLI Deluxe', manufacturer: 'ASUS', year: 2006, price: 30, tier: 'D', socket: 'AM2', chipset: 'nForce 570', form: 'atx', ram: 'ddr2', slots: 4, m2: 0, pcie: 'pcie_1_0', lanes: 16, agp: null, storage: ['pata', 'sata2'], score: 22 },
  { slug: 'mb_m3a', name: 'ASUS M3A78-T', manufacturer: 'ASUS', year: 2008, price: 28, tier: 'D', socket: 'AM2+', chipset: 'AMD 780G', form: 'atx', ram: 'ddr2', slots: 4, m2: 0, pcie: 'pcie_2_0', lanes: 16, agp: null, storage: ['sata2'], score: 24 },
  { slug: 'mb_790fx', name: 'ASUS M4A79 Deluxe', manufacturer: 'ASUS', year: 2009, price: 35, tier: 'D', socket: 'AM3', chipset: 'AMD 790FX', form: 'atx', ram: 'ddr3', slots: 4, m2: 0, pcie: 'pcie_2_0', lanes: 16, agp: null, storage: ['sata2'], score: 30 },
  { slug: 'mb_990fx', name: 'ASUS Sabertooth 990FX', manufacturer: 'ASUS', year: 2011, price: 50, tier: 'C', socket: 'AM3+', chipset: 'AMD 990FX', form: 'atx', ram: 'ddr3', slots: 4, m2: 0, pcie: 'pcie_2_0', lanes: 16, agp: null, storage: ['sata3'], score: 34 },
  { slug: 'mb_p6t', name: 'ASUS P6T Deluxe', manufacturer: 'ASUS', year: 2008, price: 45, tier: 'D', socket: 'LGA1366', chipset: 'Intel X58', form: 'atx', ram: 'ddr3', slots: 6, m2: 0, pcie: 'pcie_2_0', lanes: 16, agp: null, storage: ['sata2'], score: 32 },
  { slug: 'mb_p8z68', name: 'ASUS P8Z68-V', manufacturer: 'ASUS', year: 2011, price: 40, tier: 'D', socket: 'LGA1155', chipset: 'Intel Z68', form: 'atx', ram: 'ddr3', slots: 4, m2: 0, pcie: 'pcie_2_0', lanes: 16, agp: null, storage: ['sata3'], score: 36 },
  { slug: 'mb_z97', name: 'ASUS Z97-A', manufacturer: 'ASUS', year: 2014, price: 55, tier: 'C', socket: 'LGA1150', chipset: 'Intel Z97', form: 'atx', ram: 'ddr3', slots: 4, m2: 1, pcie: 'pcie_3_0', lanes: 16, agp: null, storage: ['sata3', 'nvme_3'], score: 42 },
  { slug: 'mb_z170', name: 'ASUS Z170-A', manufacturer: 'ASUS', year: 2015, price: 70, tier: 'C', socket: 'LGA1151', chipset: 'Intel Z170', form: 'atx', ram: 'ddr4', slots: 4, m2: 1, pcie: 'pcie_3_0', lanes: 16, agp: null, storage: ['sata3', 'nvme_3'], score: 48 },
  { slug: 'mb_z390', name: 'ASUS ROG Maximus XI Hero', manufacturer: 'ASUS', year: 2018, price: 180, tier: 'A', socket: 'LGA1151', chipset: 'Intel Z390', form: 'atx', ram: 'ddr4', slots: 4, m2: 2, pcie: 'pcie_3_0', lanes: 16, agp: null, storage: ['sata3', 'nvme_3'], score: 58 },
  { slug: 'mb_z490', name: 'MSI MPG Z490 Gaming Edge', manufacturer: 'MSI', year: 2020, price: 160, tier: 'A', socket: 'LGA1200', chipset: 'Intel Z490', form: 'atx', ram: 'ddr4', slots: 4, m2: 2, pcie: 'pcie_3_0', lanes: 16, agp: null, storage: ['sata3', 'nvme_3'], score: 60 },
  { slug: 'mb_z690', name: 'MSI PRO Z690-A', manufacturer: 'MSI', year: 2021, price: 190, tier: 'A', socket: 'LGA1700', chipset: 'Intel Z690', form: 'atx', ram: 'ddr5', slots: 4, m2: 4, pcie: 'pcie_5_0', lanes: 16, agp: null, storage: ['sata3', 'nvme_4', 'nvme_5'], score: 78 },
  { slug: 'mb_z890', name: 'ASUS ROG Maximus Z890 Hero', manufacturer: 'ASUS', year: 2024, price: 620, tier: 'S', socket: 'LGA1851', chipset: 'Intel Z890', form: 'atx', ram: 'ddr5', slots: 4, m2: 5, pcie: 'pcie_5_0', lanes: 16, agp: null, storage: ['sata3', 'nvme_4', 'nvme_5'], score: 90 },
  { slug: 'mb_b450', name: 'MSI B450 Tomahawk', manufacturer: 'MSI', year: 2018, price: 70, tier: 'B', socket: 'AM4', chipset: 'AMD B450', form: 'atx', ram: 'ddr4', slots: 4, m2: 1, pcie: 'pcie_3_0', lanes: 16, agp: null, storage: ['sata3', 'nvme_3'], score: 50 },
  { slug: 'mb_itx', name: 'ASUS ROG Strix B650E-I', manufacturer: 'ASUS', year: 2022, price: 250, tier: 'A', socket: 'AM5', chipset: 'B650', form: 'mini_itx', ram: 'ddr5', slots: 2, m2: 2, pcie: 'pcie_5_0', lanes: 16, agp: null, storage: ['nvme_5', 'sata3'], score: 70 },
]

function boardItem(row: BoardRow): SeedItem {
  return {
    slug: row.slug,
    name: row.name,
    manufacturer: row.manufacturer,
    type: 'motherboard',
    releaseYear: row.year,
    priceUsd: row.price,
    baseTier: row.tier,
    tdpWatts: 0,
    performanceScore: row.score,
    motherboard: {
      socketName: row.socket,
      chipsetName: row.chipset,
      formFactor: row.form,
      ramGen: row.ram,
      ramSlots: row.slots,
      m2Slots: row.m2,
      pcieSlot: row.pcie,
      pcieLanes: row.lanes,
      agpSlot: row.agp,
      storageInterfaces: row.storage,
    },
  }
}

const REST: SeedItem[] = [
  {
    slug: 'r_sdr_512',
    name: 'Kingston 512MB SDR-133',
    manufacturer: 'Kingston',
    type: 'ram',
    releaseYear: 2000,
    priceUsd: 6,
    baseTier: 'F',
    tdpWatts: 0,
    performanceScore: 4,
    ram: { gen: 'sdr', capacityMb: 512, modules: 1, mhz: 133, cas: 3, voltage: 3.3 },
  },
  {
    slug: 'r_ddr_1gb',
    name: 'Corsair 1GB (2x512MB) DDR-400',
    manufacturer: 'Corsair',
    type: 'ram',
    releaseYear: 2004,
    priceUsd: 10,
    baseTier: 'F',
    tdpWatts: 0,
    performanceScore: 8,
    ram: { gen: 'ddr', capacityMb: 1024, modules: 2, mhz: 400, cas: 2, voltage: 2.6 },
  },
  {
    slug: 'r_ddr3_8',
    name: 'Kingston HyperX 8GB (2x4) DDR3-1600 CL9',
    manufacturer: 'Kingston',
    type: 'ram',
    releaseYear: 2011,
    priceUsd: 18,
    baseTier: 'D',
    tdpWatts: 0,
    performanceScore: 22,
    ram: { gen: 'ddr3', capacityMb: 8192, modules: 2, mhz: 1600, cas: 9, voltage: 1.5 },
  },
  {
    slug: 'st_pata',
    name: 'Maxtor DiamondMax 80GB PATA',
    manufacturer: 'Maxtor',
    type: 'storage',
    releaseYear: 2002,
    priceUsd: 8,
    baseTier: 'F',
    tdpWatts: 0,
    performanceScore: 2,
    storage: { interface: 'pata', capacityMb: 81920, readMbS: 45, kind: 'hdd' },
  },
  {
    slug: 'st_sata1',
    name: 'Western Digital Caviar 160GB SATA I',
    manufacturer: 'Western Digital',
    type: 'storage',
    releaseYear: 2005,
    priceUsd: 12,
    baseTier: 'F',
    tdpWatts: 0,
    performanceScore: 4,
    storage: { interface: 'sata1', capacityMb: 163840, readMbS: 70, kind: 'hdd' },
  },
  {
    slug: 'cs_nr200',
    name: 'Cooler Master NR200P Mini-ITX',
    manufacturer: 'Cooler Master',
    type: 'case',
    releaseYear: 2020,
    priceUsd: 100,
    baseTier: 'A',
    tdpWatts: 0,
    performanceScore: 78,
    case: {
      supportedFormFactors: ['mini_itx'],
      maxGpuLengthMm: 330,
      maxCoolerHeightMm: 155,
      radiatorSupportMm: [280],
      fanSlots: 7,
      airflowScore: 78,
      psuFormFactor: 'sfx',
    },
  },
  {
    slug: 'ps_sfx750',
    name: 'Corsair SF750 SFX ATX 3.0',
    manufacturer: 'Corsair',
    type: 'psu',
    releaseYear: 2023,
    priceUsd: 160,
    baseTier: 'A',
    tdpWatts: 0,
    performanceScore: 75,
    psu: {
      wattage: 750,
      formFactor: 'sfx',
      modular: 'full_modular',
      efficiency: '80+ Platinum',
      atxVersion: 3,
      rail12vAmps: 62,
      rail5vAmps: 20,
      rail33vAmps: 20,
      connectors: { pcie_8pin: 2, hpwr_16pin: 1 },
      topology: 'dc_dc',
      has12vhpwr: true,
    },
  },
  {
    slug: 'ps_450group',
    name: 'Fuente genérica 450W regulación grupal',
    manufacturer: 'Genérico',
    type: 'psu',
    releaseYear: 2012,
    priceUsd: 25,
    baseTier: 'F',
    tdpWatts: 0,
    performanceScore: 20,
    psu: {
      wattage: 450,
      formFactor: 'atx',
      modular: 'non_modular',
      efficiency: 'Genérica',
      atxVersion: 2,
      rail12vAmps: 18,
      rail5vAmps: 20,
      rail33vAmps: 22,
      connectors: { pcie_6pin: 1, molex_4pin: 3 },
      topology: 'group',
      has12vhpwr: false,
    },
  },
]

interface GpuRow {
  slug: string
  name: string
  manufacturer: string
  year: number
  price: number
  tier: Tier
  tdp: number
  score: number
  architecture: string
  bus: BusInterface
  lanes: number
  nm: number
  base: number
  boost: number
  shaders: number
  tmus: number
  rops: number
  rt: number
  tensor: number
  vramType: string
  vramMb: number
  busBits: number
  bandwidth: number
  length: number
  height: number
  slots: number
  connectors: Record<string, number>
  psu: number
  peak: number
  form: string
  fans: number
  color: number
  accent: number
}

const NVIDIA = { color: 0x171717, accent: 0x76b900 }
const AMD_VISUAL = { color: 0x18181b, accent: 0xed1c24 }
const INTEL_ARC = { color: 0x111111, accent: 0x0071c5 }

const GPUS: GpuRow[] = [
  { slug: 'g_arc_a380', name: 'Intel Arc A380 6GB', manufacturer: 'Intel', year: 2022, price: 139, tier: 'D', tdp: 75, score: 34, architecture: 'Alchemist ACM-G11', bus: 'pcie_4_0', lanes: 8, nm: 6, base: 2000, boost: 2000, shaders: 1024, tmus: 64, rops: 32, rt: 8, tensor: 128, vramType: 'GDDR6', vramMb: 6144, busBits: 96, bandwidth: 186, length: 169, height: 110, slots: 2, connectors: {}, psu: 350, peak: 75, form: 'dual', fans: 2, ...INTEL_ARC },
  { slug: 'g_arc_a580', name: 'Intel Arc A580 8GB', manufacturer: 'Intel', year: 2023, price: 179, tier: 'C', tdp: 185, score: 56, architecture: 'Alchemist ACM-G10', bus: 'pcie_4_0', lanes: 16, nm: 6, base: 1700, boost: 2000, shaders: 3072, tmus: 192, rops: 96, rt: 24, tensor: 384, vramType: 'GDDR6', vramMb: 8192, busBits: 256, bandwidth: 512, length: 270, height: 125, slots: 2.5, connectors: { pcie_8pin: 1 }, psu: 450, peak: 210, form: 'dual', fans: 2, ...INTEL_ARC },
  { slug: 'g_arc_a750', name: 'Intel Arc A750 8GB', manufacturer: 'Intel', year: 2022, price: 289, tier: 'B', tdp: 225, score: 62, architecture: 'Alchemist ACM-G10', bus: 'pcie_4_0', lanes: 16, nm: 6, base: 2050, boost: 2400, shaders: 3584, tmus: 224, rops: 112, rt: 28, tensor: 448, vramType: 'GDDR6', vramMb: 8192, busBits: 256, bandwidth: 512, length: 270, height: 125, slots: 2.5, connectors: { pcie_8pin: 1, pcie_6pin: 1 }, psu: 550, peak: 250, form: 'dual', fans: 2, ...INTEL_ARC },
  { slug: 'g_arc_a770', name: 'Intel Arc A770 16GB', manufacturer: 'Intel', year: 2022, price: 349, tier: 'B', tdp: 225, score: 68, architecture: 'Alchemist ACM-G10', bus: 'pcie_4_0', lanes: 16, nm: 6, base: 2100, boost: 2400, shaders: 4096, tmus: 256, rops: 128, rt: 32, tensor: 512, vramType: 'GDDR6', vramMb: 16384, busBits: 256, bandwidth: 560, length: 272, height: 130, slots: 2.5, connectors: { pcie_8pin: 1, pcie_6pin: 1 }, psu: 550, peak: 250, form: 'dual', fans: 2, ...INTEL_ARC },
  { slug: 'g_arc_b570', name: 'Intel Arc B570 10GB', manufacturer: 'Intel', year: 2025, price: 219, tier: 'B', tdp: 150, score: 66, architecture: 'Battlemage BMG-G21', bus: 'pcie_4_0', lanes: 8, nm: 5, base: 2500, boost: 2750, shaders: 2304, tmus: 144, rops: 72, rt: 18, tensor: 144, vramType: 'GDDR6', vramMb: 10240, busBits: 160, bandwidth: 380, length: 272, height: 120, slots: 2, connectors: { pcie_8pin: 1 }, psu: 600, peak: 170, form: 'dual', fans: 2, ...INTEL_ARC },
  { slug: 'g_arc_b580', name: 'Intel Arc B580 12GB', manufacturer: 'Intel', year: 2024, price: 249, tier: 'A', tdp: 190, score: 74, architecture: 'Battlemage BMG-G21', bus: 'pcie_4_0', lanes: 8, nm: 5, base: 2670, boost: 2670, shaders: 2560, tmus: 160, rops: 80, rt: 20, tensor: 160, vramType: 'GDDR6', vramMb: 12288, busBits: 192, bandwidth: 456, length: 272, height: 120, slots: 2, connectors: { pcie_8pin: 1 }, psu: 600, peak: 210, form: 'dual', fans: 2, ...INTEL_ARC },
  { slug: 'g_nv_rtx4070', name: 'NVIDIA GeForce RTX 4070 12GB', manufacturer: 'NVIDIA', year: 2023, price: 599, tier: 'A', tdp: 200, score: 76, architecture: 'Ada Lovelace AD104', bus: 'pcie_4_0', lanes: 16, nm: 5, base: 1920, boost: 2475, shaders: 5888, tmus: 184, rops: 64, rt: 46, tensor: 184, vramType: 'GDDR6X', vramMb: 12288, busBits: 192, bandwidth: 504, length: 244, height: 112, slots: 2, connectors: { hpwr_16pin: 1 }, psu: 650, peak: 220, form: 'dual', fans: 2, ...NVIDIA },
  { slug: 'g_nv_rtx4070ti', name: 'NVIDIA GeForce RTX 4070 Ti 12GB', manufacturer: 'NVIDIA', year: 2023, price: 799, tier: 'A', tdp: 285, score: 84, architecture: 'Ada Lovelace AD104', bus: 'pcie_4_0', lanes: 16, nm: 5, base: 2310, boost: 2610, shaders: 7680, tmus: 240, rops: 80, rt: 60, tensor: 240, vramType: 'GDDR6X', vramMb: 12288, busBits: 192, bandwidth: 504, length: 304, height: 137, slots: 3, connectors: { hpwr_16pin: 1 }, psu: 700, peak: 320, form: 'triple', fans: 3, ...NVIDIA },
  { slug: 'g_nv_rtx4080', name: 'NVIDIA GeForce RTX 4080 16GB', manufacturer: 'NVIDIA', year: 2022, price: 1199, tier: 'S', tdp: 320, score: 88, architecture: 'Ada Lovelace AD103', bus: 'pcie_4_0', lanes: 16, nm: 5, base: 2205, boost: 2505, shaders: 9728, tmus: 304, rops: 112, rt: 76, tensor: 304, vramType: 'GDDR6X', vramMb: 16384, busBits: 256, bandwidth: 717, length: 304, height: 137, slots: 3, connectors: { hpwr_16pin: 1 }, psu: 750, peak: 360, form: 'triple', fans: 3, ...NVIDIA },
  { slug: 'g_nv_rtx5060ti', name: 'NVIDIA GeForce RTX 5060 Ti 16GB', manufacturer: 'NVIDIA', year: 2025, price: 429, tier: 'B', tdp: 180, score: 72, architecture: 'Blackwell GB206', bus: 'pcie_5_0', lanes: 8, nm: 5, base: 2407, boost: 2572, shaders: 4608, tmus: 144, rops: 48, rt: 36, tensor: 144, vramType: 'GDDR7', vramMb: 16384, busBits: 128, bandwidth: 448, length: 241, height: 112, slots: 2, connectors: { pcie_8pin: 1 }, psu: 600, peak: 200, form: 'dual', fans: 2, ...NVIDIA },
  { slug: 'g_amd_rx7600', name: 'AMD Radeon RX 7600 8GB', manufacturer: 'AMD', year: 2023, price: 269, tier: 'C', tdp: 165, score: 54, architecture: 'RDNA 3 Navi 33', bus: 'pcie_4_0', lanes: 8, nm: 6, base: 2250, boost: 2655, shaders: 2048, tmus: 128, rops: 64, rt: 32, tensor: 64, vramType: 'GDDR6', vramMb: 8192, busBits: 128, bandwidth: 288, length: 204, height: 110, slots: 2, connectors: { pcie_8pin: 1 }, psu: 550, peak: 185, form: 'dual', fans: 2, ...AMD_VISUAL },
  { slug: 'g_amd_rx7700xt', name: 'AMD Radeon RX 7700 XT 12GB', manufacturer: 'AMD', year: 2023, price: 449, tier: 'B', tdp: 245, score: 72, architecture: 'RDNA 3 Navi 32', bus: 'pcie_4_0', lanes: 16, nm: 5, base: 2171, boost: 2544, shaders: 3456, tmus: 216, rops: 96, rt: 54, tensor: 108, vramType: 'GDDR6', vramMb: 12288, busBits: 192, bandwidth: 432, length: 267, height: 120, slots: 2.5, connectors: { pcie_8pin: 2 }, psu: 700, peak: 280, form: 'dual', fans: 2, ...AMD_VISUAL },
  { slug: 'g_amd_rx7900xt', name: 'AMD Radeon RX 7900 XT 20GB', manufacturer: 'AMD', year: 2022, price: 899, tier: 'S', tdp: 315, score: 90, architecture: 'RDNA 3 Navi 31', bus: 'pcie_4_0', lanes: 16, nm: 5, base: 2000, boost: 2400, shaders: 5376, tmus: 336, rops: 192, rt: 84, tensor: 168, vramType: 'GDDR6', vramMb: 20480, busBits: 320, bandwidth: 800, length: 276, height: 135, slots: 2.5, connectors: { pcie_8pin: 2 }, psu: 750, peak: 360, form: 'triple', fans: 3, ...AMD_VISUAL },
  { slug: 'g_amd_rx6600', name: 'AMD Radeon RX 6600 8GB', manufacturer: 'AMD', year: 2021, price: 329, tier: 'C', tdp: 132, score: 62, architecture: 'RDNA 2 Navi 23', bus: 'pcie_4_0', lanes: 8, nm: 7, base: 2044, boost: 2491, shaders: 1792, tmus: 112, rops: 64, rt: 28, tensor: 0, vramType: 'GDDR6', vramMb: 8192, busBits: 128, bandwidth: 224, length: 204, height: 110, slots: 2, connectors: { pcie_8pin: 1 }, psu: 450, peak: 150, form: 'dual', fans: 2, ...AMD_VISUAL },
  { slug: 'g_amd_rx6650xt', name: 'AMD Radeon RX 6650 XT 8GB', manufacturer: 'AMD', year: 2022, price: 399, tier: 'C', tdp: 180, score: 62, architecture: 'RDNA 2 Navi 23', bus: 'pcie_4_0', lanes: 8, nm: 7, base: 2410, boost: 2635, shaders: 2048, tmus: 128, rops: 64, rt: 32, tensor: 0, vramType: 'GDDR6', vramMb: 8192, busBits: 128, bandwidth: 280, length: 240, height: 120, slots: 2, connectors: { pcie_8pin: 1 }, psu: 500, peak: 200, form: 'dual', fans: 2, ...AMD_VISUAL },
  { slug: 'g_amd_rx6750xt', name: 'AMD Radeon RX 6750 XT 12GB', manufacturer: 'AMD', year: 2022, price: 549, tier: 'B', tdp: 250, score: 70, architecture: 'RDNA 2 Navi 22', bus: 'pcie_4_0', lanes: 16, nm: 7, base: 2495, boost: 2600, shaders: 2560, tmus: 160, rops: 64, rt: 40, tensor: 0, vramType: 'GDDR6', vramMb: 12288, busBits: 192, bandwidth: 432, length: 267, height: 120, slots: 2.5, connectors: { pcie_8pin: 2 }, psu: 650, peak: 280, form: 'dual', fans: 2, ...AMD_VISUAL },
  { slug: 'g_nv_gtx1660ti', name: 'NVIDIA GeForce GTX 1660 Ti 6GB', manufacturer: 'NVIDIA', year: 2019, price: 279, tier: 'C', tdp: 120, score: 58, architecture: 'Turing TU116', bus: 'pcie_3_0', lanes: 16, nm: 12, base: 1500, boost: 1770, shaders: 1536, tmus: 96, rops: 48, rt: 0, tensor: 0, vramType: 'GDDR6', vramMb: 6144, busBits: 192, bandwidth: 288, length: 205, height: 111, slots: 2, connectors: { pcie_8pin: 1 }, psu: 450, peak: 140, form: 'dual', fans: 2, ...NVIDIA },
]

function gpuItem(row: GpuRow): SeedItem {
  return {
    slug: row.slug,
    name: row.name,
    manufacturer: row.manufacturer,
    type: 'gpu',
    releaseYear: row.year,
    priceUsd: row.price,
    baseTier: row.tier,
    tdpWatts: row.tdp,
    performanceScore: row.score,
    gpu: {
      architecture: row.architecture,
      busInterface: row.bus,
      busLanes: row.lanes,
      lithographyNm: row.nm,
      baseClockMhz: row.base,
      boostClockMhz: row.boost,
      shaderCores: row.shaders,
      tmus: row.tmus,
      rops: row.rops,
      rayTracingCores: row.rt,
      tensorCores: row.tensor,
      vramType: row.vramType,
      vramMb: row.vramMb,
      memoryBusWidthBits: row.busBits,
      memoryBandwidthGbps: row.bandwidth,
      lengthMm: row.length,
      heightMm: row.height,
      slotWidth: row.slots,
      powerConnectors: row.connectors,
      recommendedPsuWatts: row.psu,
      peakTransientSpikeWatts: row.peak,
      directxMax: 12,
      vulkan: true,
      visual: { form: row.form, fans: row.fans, color: row.color, accentColor: row.accent },
    },
  }
}

export const EXPANSION: SeedItem[] = [
  ...CPUS.map(cpuItem),
  ...GPUS.map(gpuItem),
  ...BOARDS.map(boardItem),
  ...REST,
]
