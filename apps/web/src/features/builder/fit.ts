import type { CatalogItem, MarketOffer } from '@pc/shared'

export type Fit = 'compatible' | 'incompatible' | 'unknown'
export type DesktopRam = 'ddr5' | 'ddr4' | 'ddr3'

const EXPLICIT: [string, RegExp][] = [
  ['LGA1851', /LGA\s*1851|\bS\s*1851\b|\b1851\b/i],
  ['LGA1700', /LGA\s*1700|\bS\s*1700\b|\b1700\b/i],
  ['LGA1200', /LGA\s*1200|\bS\s*1200\b|\b1200\b/i],
  ['LGA1151', /LGA\s*1151|\bS\s*1151\b|\b1151\b/i],
  ['LGA1150', /LGA\s*1150|\b1150\b/i],
  ['LGA1155', /LGA\s*1155|\b1155\b/i],
  ['LGA2066', /LGA\s*2066|\b2066\b/i],
  ['LGA478', /SOCKET\s*478|\bS478\b/i],
  ['AM5', /\bAM5\b/i],
  ['AM4', /\bAM4\b/i],
  ['AM3', /\bAM3\b/i],
]

const CHIPSETS: [string, RegExp][] = [
  ['LGA1851', /\b(?:H810|B860|Z890)M?\b/i],
  ['LGA1700', /\b(?:H610|B660|H670|Z690|B760|H770|Z790)M?\b/i],
  ['LGA1200', /\b(?:H410|B460|H470|Z490|H510|B560|H570|Z590)M?\b/i],
  ['AM5', /\b(?:A620|B650E?|B850|X670E?|X870E?)M?\b/i],
  ['AM4', /\b(?:A320|B350|X370|B450|X470|A520|B550|X570)M?\b/i],
]

export type BoardSize = 'e-atx' | 'atx' | 'matx' | 'itx'

export function socketsIn(name: string): string[] {
  const explicit = unique(EXPLICIT.filter(([, pattern]) => pattern.test(name)).map(([id]) => id))
  if (explicit.length > 0) return explicit
  return unique(CHIPSETS.filter(([, pattern]) => pattern.test(name)).map(([id]) => id))
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export function normalizeSocket(value: string | null | undefined): string | null {
  if (!value) return null
  return socketsIn(value)[0] ?? null
}

export function ramGen(name: string): DesktopRam | null {
  const ddr5 = /ddr5/i.test(name)
  const ddr4 = /ddr4/i.test(name)
  const ddr3 = /ddr3/i.test(name)
  if ([ddr5, ddr4, ddr3].filter(Boolean).length !== 1) return null
  if (ddr5) return 'ddr5'
  if (ddr4) return 'ddr4'
  return 'ddr3'
}

/** LGA1700 arma mothers y RAM tanto DDR4 como DDR5. El resto usa la generación del catálogo. */
export function ramGensFor(cpu: CatalogItem | null): DesktopRam[] {
  if (!cpu?.cpu) return []
  const socket = normalizeSocket(cpu.cpu.socketName)
  const arch = cpu.cpu.architecture.toLowerCase()
  if (socket === 'LGA1700' || /alder|raptor/.test(arch)) return ['ddr4', 'ddr5']
  if (cpu.cpu.maxRamGen === 'ddr5' || cpu.cpu.maxRamGen === 'ddr4' || cpu.cpu.maxRamGen === 'ddr3') return [cpu.cpu.maxRamGen]
  return []
}

function memoryOf(socket: string, name: string): DesktopRam | null {
  const stated = ramGen(name)
  if (stated) return stated
  if (socket === 'AM5' || socket === 'LGA1851') return 'ddr5'
  if (socket === 'AM4' || socket === 'LGA1200' || socket === 'LGA1151' || socket === 'LGA1150' || socket === 'LGA1155') return 'ddr4'
  return null
}

export function cpuLoadWatts(cpu: CatalogItem | null): number {
  if (!cpu) return 0
  return cpu.cpu?.peakTransientTdpWatts ?? cpu.tdpWatts ?? 0
}

export function includesStockCooler(cpu: CatalogItem | null): boolean {
  if (!cpu) return false
  if (/ryzen/i.test(cpu.name)) return !/\d{3,4}x3d|\d{3,4}x\b/i.test(cpu.name)
  if (/intel|core/i.test(cpu.name)) return !/\d{4,5}kf?\b/i.test(cpu.name)
  return false
}

export function motherSlots(name: string | null): number {
  if (!name) return 4
  const counted = name.match(/(\d)\s*(?:slot|dimm)/i)
  if (counted) return Math.min(4, Math.max(1, Number(counted[1])))
  if (/mini[-\s]*itx|\bitx\b/i.test(name)) return 2
  return 4
}

export function ramModules(name: string): number {
  const counted = name.match(/(\d)\s*x\s*\d+/i)
  if (!counted) return 1
  return Math.min(4, Math.max(1, Number(counted[1])))
}

export type DriveKind = 'hdd' | 'ssd25' | 'm2'

export function driveKind(name: string): DriveKind | null {
  if (/\bm\.?\s*2\b|nvme/i.test(name)) return 'm2'
  if (/\bhdd\b|r[ií]gido/i.test(name)) return 'hdd'
  if (/\bssd\b|s[oó]lido/i.test(name)) return 'ssd25'
  return null
}

export function nvmeGen(name: string): number | null {
  const match = name.match(/gen\s*([1-5])|pcie\s*([1-5])(?:\.0)?|nvme\s*([1-5])/i)
  const value = match?.[1] ?? match?.[2] ?? match?.[3]
  return value ? Number(value) : null
}

export function coreCount(name: string): number | null {
  const labeled = name.match(/(\d{1,2})\s*(?:n[uú]cleos|cores)\b/i)
  if (labeled) return Number(labeled[1])
  const pair = name.match(/\b(\d{1,2})\s*c\s*\/\s*\d{1,2}\s*t\b/i)
  if (pair) return Number(pair[1])
  return null
}

export function videoMemory(name: string): string | null {
  const gddr = /gddr\s*([3-7])\s*(x)?/i.exec(name)
  if (gddr) return `GDDR${gddr[1]}${gddr[2] ? 'X' : ''}`
  const ddr = /\bddr\s*([345])\b/i.exec(name)
  if (ddr) return `GDDR${ddr[1]}`
  return null
}

export type TowerKind = 'full' | 'mid' | 'low'
export type CaseFilter = BoardSize | TowerKind

export function towerKind(name: string): TowerKind | null {
  if (/full\s*tower/i.test(name)) return 'full'
  if (/mid\s*tower/i.test(name)) return 'mid'
  if (/low\s*tower|mini\s*tower|\bslim\b/i.test(name)) return 'low'
  return null
}

export function matchesCase(name: string, filter: CaseFilter): boolean {
  if (filter === 'full' || filter === 'mid' || filter === 'low') return towerKind(name) === filter
  return formFactors(name).includes(filter)
}

export function capacityGb(name: string): number | null {
  const tb = name.match(/(\d+(?:[.,]\d+)?)\s*tb\b/i)
  if (tb) return Math.round(Number(tb[1].replace(',', '.')) * 1024)
  const gb = name.match(/(\d+(?:[.,]\d+)?)\s*gb\b/i)
  if (gb) return Math.round(Number(gb[1].replace(',', '.')))
  return null
}

export type PsuCert = 'white' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'titanium'

export function psuCert(name: string): PsuCert | null {
  if (/titanium/i.test(name)) return 'titanium'
  if (/platinum/i.test(name)) return 'platinum'
  if (/gold/i.test(name)) return 'gold'
  if (/silver/i.test(name)) return 'silver'
  if (/bronze/i.test(name)) return 'bronze'
  if (/80\s*\+|80\s*plus/i.test(name)) return 'white'
  return null
}

export function coolerWatts(name: string): number | null {
  const values = [...name.matchAll(/(\d{2,3})\s*w\b/gi)].map((match) => Number(match[1]))
  const useful = values.filter((value) => value >= 50 && value <= 420)
  return useful.length > 0 ? Math.max(...useful) : null
}

export function wattsOf(name: string): number | null {
  const values = [...name.matchAll(/(\d{3,4})\s*w\b/gi)].map((match) => Number(match[1]))
  const useful = values.filter((value) => value >= 300 && value <= 2000)
  return useful.length > 0 ? Math.max(...useful) : null
}

export function formFactors(name: string): BoardSize[] {
  const found: BoardSize[] = []
  if (/e-?atx/i.test(name)) found.push('e-atx')
  if (/mini[-\s]*itx|\bitx\b/i.test(name)) found.push('itx')
  if (/micro[-\s]*atx|m-atx|\bmatx\b/i.test(name)) found.push('matx')
  const withoutSmall = name.replace(/micro[-\s]*atx|m-atx|matx|e-?atx|mini[-\s]*itx/gi, ' ')
  if (/\batx\b/i.test(withoutSmall)) found.push('atx')
  return found
}

function caseFits(board: BoardSize, sizes: BoardSize[]): boolean {
  if (sizes.includes('e-atx')) return true
  if (sizes.includes('atx')) return board !== 'e-atx'
  if (sizes.includes('matx')) return board === 'matx' || board === 'itx'
  if (sizes.includes('itx')) return board === 'itx'
  return false
}

export function marketHints(step: string, cpu: CatalogItem | null, motherName: string | null, typed: string): string[] {
  if (typed) return [typed]
  if (!cpu) return ['']
  if (step === 'motherboard') {
    const socket = normalizeSocket(cpu.cpu?.socketName)
    if (!socket) return ['']
    return [socket.startsWith('LGA') ? socket.slice(3) : socket]
  }
  if (step === 'ram') {
    const gens = ramGensFor(cpu)
    const motherGen = motherName ? ramGen(motherName) : null
    const allowed = motherGen && gens.includes(motherGen) ? [motherGen] : gens
    if (allowed.length === 0) return ['']
    return allowed.map((gen) => gen.toUpperCase())
  }
  return ['']
}

export interface FitContext {
  cpu: CatalogItem | null
  motherName: string | null
  caseName: string | null
  recommendedWatts: number
}

export function offerFit(offer: MarketOffer, step: string, context: FitContext): { status: Fit; note: string } {
  const cpuSocket = normalizeSocket(context.cpu?.cpu?.socketName)
  const allowedRam = ramGensFor(context.cpu)

  if (step === 'motherboard') {
    const sockets = socketsIn(offer.name)
    if (!cpuSocket) return { status: 'unknown', note: 'Elegí un procesador para comprobar el socket.' }
    if (sockets.length === 0) return { status: 'unknown', note: 'El título no dice el socket.' }
    if (!sockets.includes(cpuSocket)) return { status: 'incompatible', note: `Pide ${sockets.join(' / ')} y el procesador es ${cpuSocket}.` }
    const memory = memoryOf(cpuSocket, offer.name)
    if (memory && allowedRam.length > 0 && !allowedRam.includes(memory)) {
      return { status: 'incompatible', note: `Es ${memory.toUpperCase()} y este procesador no la usa.` }
    }
    if (!memory) return { status: 'unknown', note: `Socket ${cpuSocket}, pero no se sabe si es DDR4 o DDR5.` }
    return { status: 'compatible', note: `${cpuSocket} · ${memory.toUpperCase()}.` }
  }

  if (step === 'ram') {
    const gen = ramGen(offer.name)
    const motherGen = context.motherName ? ramGen(context.motherName) : null
    const allowed = motherGen && allowedRam.includes(motherGen) ? [motherGen] : allowedRam
    if (allowed.length === 0) return { status: 'unknown', note: 'Elegí un procesador para comprobar la memoria.' }
    if (!gen) return { status: 'unknown', note: 'El título no dice si es DDR4 o DDR5.' }
    if (allowed.includes(gen)) return { status: 'compatible', note: gen.toUpperCase() }
    const label = allowed.map((item) => item.toUpperCase()).join(' o ')
    return { status: 'incompatible', note: `Es ${gen.toUpperCase()} y este armado usa ${label}.` }
  }

  if (step === 'cooler') {
    const sockets = socketsIn(offer.name)
    if (!cpuSocket) return { status: 'unknown', note: 'Elegí un procesador para comprobar el anclaje.' }
    if (sockets.length === 0) return { status: 'unknown', note: 'El título no lista sockets.' }
    if (sockets.includes(cpuSocket)) return { status: 'compatible', note: `Anclaje ${cpuSocket}.` }
    return { status: 'incompatible', note: `No lista ${cpuSocket}.` }
  }

  if (step === 'psu') {
    const watts = wattsOf(offer.name)
    if (!watts) return { status: 'unknown', note: 'El título no dice los watts.' }
    if (context.recommendedWatts > 0 && watts < context.recommendedWatts) {
      return { status: 'incompatible', note: `${watts} W quedan bajo los ${context.recommendedWatts} W del armado.` }
    }
    return { status: 'compatible', note: context.recommendedWatts > 0 ? `Cubre los ${context.recommendedWatts} W del armado.` : `${watts} W.` }
  }

  if (step === 'case') {
    const boardSizes = context.motherName ? formFactors(context.motherName) : []
    const caseSizes = formFactors(offer.name)
    const board = boardSizes[0]
    if (!context.motherName) return { status: 'unknown', note: 'Elegí una motherboard para comprobar el tamaño.' }
    if (!board) return { status: 'unknown', note: 'El título de la motherboard no dice el tamaño.' }
    if (caseSizes.length === 0) return { status: 'unknown', note: 'El título no dice el factor de forma.' }
    if (caseFits(board, caseSizes)) return { status: 'compatible', note: 'Entra el tamaño de la motherboard.' }
    return { status: 'incompatible', note: `La motherboard es ${board.toUpperCase()} y este gabinete no la lista.` }
  }

  return { status: 'compatible', note: '' }
}
