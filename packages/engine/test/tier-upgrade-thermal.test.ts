import type { CatalogItem } from '@pc/shared'
import { describe, expect, it } from 'vitest'
import { analyzeBuild } from '../src/analyze'
import { EMPTY_CONTEXT } from '../src/context'
import { analyzeThermal } from '../src/thermal'
import { percentileRank, rankCatalog } from '../src/tier'
import { build, item } from './fixtures'

describe('tiers', () => {
  it('ordena percentiles de menor a mayor', () => {
    expect(percentileRank(1, [1, 2, 3, 4])).toBeLessThan(percentileRank(4, [1, 2, 3, 4]))
    expect(percentileRank(4, [1, 2, 3, 4])).toBeGreaterThan(80)
  })

  it('penaliza una GPU alta junto a una fuente de cola', () => {
    const gpus: CatalogItem[] = [10, 20, 30, 40, 50, 100].map((score) =>
      item({
        slug: `g${score}`,
        type: 'gpu',
        name: `G${score}`,
        releaseYear: 2024,
        performanceScore: score,
        baseTier: 'C',
      }),
    )
    const psus: CatalogItem[] = [5, 8, 12, 20, 40, 80].map((score) =>
      item({
        slug: `p${score}`,
        type: 'psu',
        name: `P${score}`,
        releaseYear: 2024,
        performanceScore: score,
        psu: {
          wattage: 500 + score,
          formFactor: 'atx',
          modular: null,
          efficiency: '80+ Gold',
          atxVersion: 3,
          rail12vAmps: 80,
          rail5vAmps: null,
          rail33vAmps: null,
          connectors: null,
          topology: 'dc_dc',
          has12vhpwr: true,
        },
      }),
    )
    const catalog = [...gpus, ...psus]
    const ranks = rankCatalog(catalog)
    expect(ranks.get('g100')).not.toBe(ranks.get('g10'))
    const analysis = analyzeBuild(
      build({
        gpu: gpus.find((entry) => entry.slug === 'g100'),
        psu: psus.find((entry) => entry.slug === 'p5'),
      }),
      catalog,
      EMPTY_CONTEXT,
    )
    expect(analysis.tiers.penalties.some((line) => line.includes('fuente'))).toBe(true)
    expect(analysis.tiers.globalValue).toBeLessThan(7)
  })
})

describe('térmica y actualización', () => {
  it('sube las RPM cuando el calor supera al disipador', () => {
    const cool = analyzeThermal(
      build({
        cpu: item({ slug: 'cpu', type: 'cpu', name: 'CPU', tdpWatts: 65 }),
        cooler: item({
          slug: 'cl',
          type: 'cooler',
          name: 'Torre',
          cooler: { tdpMax: 260, coolerType: 'air', maxRpm: 1500, noiseDb: 24, heightMm: 165, socketNames: ['AM5'] },
        }),
      }),
    )
    const hot = analyzeThermal(
      build({
        cpu: item({
          slug: 'cpu',
          type: 'cpu',
          name: 'CPU',
          tdpWatts: 250,
          cpu: {
            socketName: 'AM5',
            architecture: 'Zen 5',
            lithographyNm: 4,
            cores: 16,
            threads: 32,
            performanceCores: 16,
            efficiencyCores: 0,
            baseClockMhz: 4000,
            boostClockMhz: 5500,
            l1CacheKb: 0,
            l2CacheKb: 0,
            l3CacheKb: 0,
            maxRamGen: 'ddr5',
            maxMemoryChannels: 2,
            integratedGraphics: null,
            peakTransientTdpWatts: 280,
            instructionSets: [],
            ipcIndex: 2,
          },
        }),
        cooler: item({
          slug: 'stock',
          type: 'cooler',
          name: 'Stock',
          cooler: { tdpMax: 75, coolerType: 'stock', maxRpm: 2800, noiseDb: 40, heightMm: 60, socketNames: ['AM5'] },
        }),
      }),
    )
    expect(hot.throttlingRisk).toBe(true)
    expect(hot.fanPercent).toBeGreaterThan(cool.fanPercent)
    expect(hot.estimatedCpuTempC).toBeGreaterThan(cool.estimatedCpuTempC)
  })

  it('sugiere una GPU con mejor costo por punto cuando ella es el límite', () => {
    const weak = item({
      slug: 'gpu-low',
      type: 'gpu',
      name: 'Baja',
      performanceScore: 20,
      priceUsd: 100,
      tdpWatts: 120,
      releaseYear: 2020,
    })
    const better = item({
      slug: 'gpu-high',
      type: 'gpu',
      name: 'Alta',
      performanceScore: 90,
      priceUsd: 250,
      tdpWatts: 180,
      releaseYear: 2024,
    })
    const cpu = item({ slug: 'cpu', type: 'cpu', name: 'CPU', performanceScore: 100, tdpWatts: 105 })
    const analysis = analyzeBuild(build({ cpu, gpu: weak }), [cpu, weak, better], EMPTY_CONTEXT)
    expect(analysis.bottleneck.dominant?.limiting).toBe('gpu')
    expect(analysis.upgrades.some((row) => row.toSlug === 'gpu-high' && row.costPerScore != null)).toBe(
      true,
    )
  })
})
