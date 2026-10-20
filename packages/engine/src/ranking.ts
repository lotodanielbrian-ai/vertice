import { isConceptual, type CatalogItem, type Tier } from '@pc/shared'

export const GAMING_TIER_LABEL: Record<Tier, string> = {
  'S+': 'Las mejores',
  S: 'Entusiasta alto',
  A: 'Mejor precio/rendimiento',
  B: 'Gama media',
  C: 'Económica',
  D: 'Envejecida',
  E: 'Legado',
  F: 'Evitar en 2026',
}

export interface RankedPart {
  item: CatalogItem
  index: number
  tier: Tier
  position: number
}

export interface Award {
  id: string
  label: string
  item: CatalogItem
}

export interface GamingRanking {
  parts: RankedPart[]
  awards: Award[]
}

const DATACENTER = /instinct|supercluster|vera rubin|data center|mi300|b200/i

export function isExcludedFromRanking(item: CatalogItem): boolean {
  return isConceptual(item) || DATACENTER.test(`${item.slug} ${item.name}`)
}

function hasModernFeatures(item: CatalogItem): boolean {
  const gpu = item.gpu
  if (!gpu) return false
  if (gpu.rayTracingCores > 0) return true
  const arch = gpu.architecture.toLowerCase()
  const name = item.name.toLowerCase()
  if (/\brtx\b/.test(name) || /turing|ampere|ada|blackwell/.test(arch)) return true
  if (/rdna\s*[2-9]/.test(arch)) return true
  if (/\barc\b/.test(name) || /alchemist|battlemage/.test(arch)) return true
  return false
}

function vramFactor(vramMb: number | null): number {
  if (vramMb == null) return 1
  const gb = vramMb / 1024
  if (gb < 6) return 0.85
  if (gb < 8) return 0.93
  return 1
}

const MEASURED_SCALE = 138 / 175.5

export function gamingIndex(item: CatalogItem): number {
  const measured = item.benchmarks?.raster.p1440
  if (measured != null) return Math.round(measured * MEASURED_SCALE * 10) / 10
  let index = item.performanceScore
  if (item.type === 'gpu' && item.gpu) {
    if (!hasModernFeatures(item)) index *= 0.85
    index *= vramFactor(item.gpu.vramMb)
    if (item.gpu.visual.form === 'dual-gpu') index *= 0.75
  }
  if (item.type === 'cpu' && /x3d/i.test(item.name)) index *= 1.06
  return Math.round(index * 10) / 10
}

export function tierFromGamingIndex(index: number): Tier {
  if (index >= 100) return 'S+'
  if (index >= 85) return 'S'
  if (index >= 74) return 'A'
  if (index >= 63) return 'B'
  if (index >= 52) return 'C'
  if (index >= 40) return 'D'
  if (index >= 28) return 'E'
  return 'F'
}

function rtFactor(item: CatalogItem): number {
  const arch = item.gpu?.architecture.toLowerCase() ?? ''
  const name = item.name.toLowerCase()
  if (/\brtx\b/.test(name)) return 1.15
  if (/rdna\s*4/.test(arch)) return 1
  if (/\barc\b/.test(name) || /alchemist|battlemage/.test(arch)) return 0.95
  if (/rdna\s*[23]/.test(arch)) return 0.8
  return 0
}

function best(parts: RankedPart[], score: (part: RankedPart) => number): RankedPart | null {
  let winner: RankedPart | null = null
  let top = -Infinity
  for (const part of parts) {
    const value = score(part)
    if (!Number.isFinite(value)) continue
    if (value > top) {
      top = value
      winner = part
    }
  }
  return winner
}

function award(id: string, label: string, part: RankedPart | null, awards: Award[]) {
  if (part) awards.push({ id, label, item: part.item })
}

export function rankGaming(items: CatalogItem[], type: 'gpu' | 'cpu'): GamingRanking {
  const eligible = items.filter((item) => item.type === type && !isExcludedFromRanking(item))
  const ranked = eligible
    .map((item) => ({ item, index: gamingIndex(item), tier: 'C' as Tier, position: 0 }))
    .sort((a, b) => b.index - a.index || a.item.name.localeCompare(b.item.name))
  ranked.forEach((part, index) => {
    part.tier = tierFromGamingIndex(part.index)
    part.position = index + 1
  })

  const awards: Award[] = []
  award('gaming', 'Mejor para gaming', best(ranked, (part) => part.index), awards)
  if (type === 'gpu') {
    award(
      'value',
      'Mejor relación precio/rendimiento',
      best(ranked, (part) =>
        part.item.releaseYear >= 2022 && part.index >= 60 && (part.item.priceUsd ?? 0) > 0
          ? part.index / (part.item.priceUsd ?? 1)
          : -1,
      ),
      awards,
    )
    award(
      'budget',
      'Mejor económica',
      best(ranked, (part) => ((part.item.priceUsd ?? Infinity) <= 300 ? part.index : -1)),
      awards,
    )
    award(
      'qhd',
      'Mejor para 1440p',
      best(ranked, (part) =>
        (part.item.priceUsd ?? Infinity) <= 650 && (part.item.gpu?.vramMb ?? 0) >= 12 * 1024 ? part.index : -1,
      ),
      awards,
    )
    award(
      'uhd',
      'Mejor para 4K',
      best(ranked, (part) =>
        part.index >= 95 && (part.item.gpu?.vramMb ?? 0) >= 16 * 1024 && (part.item.priceUsd ?? 0) > 0
          ? part.index / (part.item.priceUsd ?? 1)
          : -1,
      ),
      awards,
    )
    const measuredRt = ranked.filter((part) => part.item.benchmarks?.rt.p1440 != null)
    award(
      'rt',
      'Mejor en ray tracing',
      best(measuredRt.length > 0 ? measuredRt : ranked, (part) => part.item.benchmarks?.rt.p1440 ?? part.index * rtFactor(part.item)),
      awards,
    )
  } else {
    award(
      'value',
      'Mejor relación precio/rendimiento',
      best(ranked, (part) => ((part.item.priceUsd ?? 0) > 0 ? part.index / (part.item.priceUsd ?? 1) : -1)),
      awards,
    )
    award(
      'budget',
      'Mejor económica',
      best(ranked, (part) => ((part.item.priceUsd ?? Infinity) <= 300 ? part.index : -1)),
      awards,
    )
  }

  return { parts: ranked, awards }
}

export function similarParts(parts: RankedPart[], slug: string, limit = 3): { part: RankedPart; deltaPercent: number }[] {
  const current = parts.find((part) => part.item.slug === slug)
  if (!current) return []
  const baseFps = current.item.benchmarks?.raster.p1440
  const base = baseFps ?? current.index
  if (base <= 0) return []
  return parts
    .filter((part) => part.item.slug !== slug && (baseFps == null || part.item.benchmarks?.raster.p1440 != null))
    .map((part) => {
      const value = baseFps != null ? (part.item.benchmarks?.raster.p1440 ?? 0) : part.index
      return { part, deltaPercent: Math.round(((value - base) / base) * 100) }
    })
    .sort((a, b) => Math.abs(a.deltaPercent) - Math.abs(b.deltaPercent))
    .slice(0, limit)
}
