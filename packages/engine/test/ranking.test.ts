import type { CatalogItem, GpuVisual } from '@pc/shared'
import { describe, expect, it } from 'vitest'
import { gamingIndex, isExcludedFromRanking, rankGaming, similarParts, tierFromGamingIndex } from '../src/ranking'
import { item } from './fixtures'

const visual = (form = 'dual'): GpuVisual => ({ form, fans: 2, color: 0, accentColor: 0 })

function gpu(partial: Partial<CatalogItem> & { slug: string; name: string; score: number }): CatalogItem {
  return item({
    slug: partial.slug,
    type: 'gpu',
    name: partial.name,
    manufacturer: partial.manufacturer ?? 'NVIDIA',
    releaseYear: partial.releaseYear ?? 2024,
    priceUsd: partial.priceUsd ?? 500,
    performanceScore: partial.score,
    gpu: partial.gpu ?? {
      architecture: 'Ada Lovelace',
      busInterface: 'pcie_4_0',
      busLanes: 16,
      lithographyNm: 5,
      baseClockMhz: 2000,
      boostClockMhz: 2500,
      shaderCores: 1000,
      tmus: 64,
      rops: 64,
      rayTracingCores: 40,
      tensorCores: 100,
      vramType: 'GDDR6X',
      vramMb: 16384,
      memoryBusWidthBits: 256,
      memoryBandwidthGbps: 500,
      lengthMm: 300,
      heightMm: 120,
      slotWidth: 2,
      powerConnectors: null,
      recommendedPsuWatts: 650,
      peakTransientSpikeWatts: null,
      directxMax: 12,
      vulkan: true,
      visual: visual(),
    },
  })
}

describe('ranking 2026', () => {
  const catalog = [
    gpu({ slug: 'g_5090', name: 'NVIDIA GeForce RTX 5090', score: 138, priceUsd: 1999, releaseYear: 2025 }),
    gpu({ slug: 'g_5080', name: 'NVIDIA GeForce RTX 5080', score: 110, priceUsd: 1099, releaseYear: 2025 }),
    gpu({ slug: 'g_4090', name: 'NVIDIA GeForce RTX 4090', score: 105, priceUsd: 1599, releaseYear: 2022 }),
    gpu({
      slug: 'g_b200',
      name: 'NVIDIA B200 Supercluster',
      score: 160,
      priceUsd: 35000,
      manufacturer: 'NVIDIA',
    }),
    gpu({
      slug: 'g_9070xtx',
      name: 'AMD Radeon RX 9070 XTX (conceptual, no lanzada)',
      score: 106,
      manufacturer: 'AMD',
    }),
    gpu({
      slug: 'g_1030',
      name: 'NVIDIA GeForce GT 1030',
      score: 20,
      priceUsd: 40,
      releaseYear: 2017,
      gpu: {
        architecture: 'Pascal GP108',
        busInterface: 'pcie_3_0',
        busLanes: 4,
        lithographyNm: 14,
        baseClockMhz: 1200,
        boostClockMhz: 1400,
        shaderCores: 384,
        tmus: 24,
        rops: 16,
        rayTracingCores: 0,
        tensorCores: 0,
        vramType: 'GDDR5',
        vramMb: 2048,
        memoryBusWidthBits: 64,
        memoryBandwidthGbps: 48,
        lengthMm: 150,
        heightMm: 70,
        slotWidth: 1,
        powerConnectors: null,
        recommendedPsuWatts: 300,
        peakTransientSpikeWatts: null,
        directxMax: 12,
        vulkan: true,
        visual: visual(),
      },
    }),
  ]

  it('pone 5090, 5080 y 4090 en S+ y en ese orden', () => {
    const ranking = rankGaming(catalog, 'gpu')
    const apex = ranking.parts.filter((part) => part.tier === 'S+').map((part) => part.item.slug)
    expect(apex).toEqual(['g_5090', 'g_5080', 'g_4090'])
    expect(tierFromGamingIndex(gamingIndex(catalog[0]!))).toBe('S+')
  })

  it('excluye datacenter y conceptuales', () => {
    expect(isExcludedFromRanking(catalog[3]!)).toBe(true)
    expect(isExcludedFromRanking(catalog[4]!)).toBe(true)
    const slugs = rankGaming(catalog, 'gpu').parts.map((part) => part.item.slug)
    expect(slugs).not.toContain('g_b200')
    expect(slugs).not.toContain('g_9070xtx')
  })

  it('deja la GT 1030 en F y elige premios', () => {
    const ranking = rankGaming(catalog, 'gpu')
    expect(ranking.parts.find((part) => part.item.slug === 'g_1030')?.tier).toBe('F')
    const byId = new Map(ranking.awards.map((entry) => [entry.id, entry.item.slug]))
    expect(byId.get('gaming')).toBe('g_5090')
    expect(byId.get('rt')).toBe('g_5090')
    expect(byId.get('budget')).toBe('g_1030')
  })

  it('prefiere el 1440p medido y encuentra las similares', () => {
    const measured = gpu({ slug: 'measured', name: 'NVIDIA GeForce RTX 4090 medida', score: 10 })
    measured.benchmarks = {
      raster: { p1080: 180, p1440: 150.8, p2160: 100 },
      rt: { p1080: 100, p1440: 80, p2160: 50 },
      source: 'https://www.techpowerup.com/review/nvidia-geforce-rtx-5090-founders-edition/',
    }
    expect(gamingIndex(measured)).toBeGreaterThan(100)
    catalog[2]!.benchmarks = {
      raster: { p1080: 170, p1440: 140, p2160: 90 },
      rt: { p1080: 90, p1440: 70, p2160: 40 },
      source: 'https://www.techpowerup.com/review/nvidia-geforce-rtx-5090-founders-edition/',
    }
    const ranking = rankGaming([...catalog, measured], 'gpu')
    const near = similarParts(ranking.parts, 'measured')
    expect(near[0]?.part.item.slug).toBe('g_4090')
  })
})
