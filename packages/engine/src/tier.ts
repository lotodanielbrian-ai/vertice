import {
  BUILD_SLOTS,
  TIER_VALUE,
  tierFromPercentile,
  tierFromValue,
  type CatalogItem,
  type ResolvedBuild,
  type Tier,
} from '@pc/shared'
import type { PowerReport } from './power'
import type { ThermalReport } from './thermal'

const SLOT_WEIGHT: Record<(typeof BUILD_SLOTS)[number], number> = {
  gpu: 0.3,
  cpu: 0.25,
  ram: 0.1,
  psu: 0.1,
  motherboard: 0.08,
  cooler: 0.07,
  storage: 0.05,
  case: 0.05,
}

export function percentileRank(value: number, values: number[]): number {
  if (values.length === 0) return 50
  let below = 0
  let equal = 0
  for (const sample of values) {
    if (sample < value) below += 1
    else if (sample === value) equal += 1
  }
  return ((below + equal / 2) / values.length) * 100
}

export function rankCatalog(items: CatalogItem[]): Map<string, Tier> {
  const byType = new Map<string, CatalogItem[]>()
  for (const item of items) {
    const list = byType.get(item.type) ?? []
    list.push(item)
    byType.set(item.type, list)
  }

  const ranks = new Map<string, Tier>()
  for (const item of items) {
    const sameType = byType.get(item.type) ?? [item]
    const cohort = sameType.filter((other) => Math.abs(other.releaseYear - item.releaseYear) <= 2)
    const cohortScores = (cohort.length >= 4 ? cohort : sameType).map((other) => other.performanceScore)
    const globalScores = sameType.map((other) => other.performanceScore)
    const cohortPercentile = percentileRank(item.performanceScore, cohortScores)
    const globalPercentile = percentileRank(item.performanceScore, globalScores)
    const blended =
      cohort.length >= 4 ? 0.65 * cohortPercentile + 0.35 * globalPercentile : globalPercentile
    ranks.set(item.slug, tierFromPercentile(blended))
  }
  return ranks
}

export interface TierReport {
  componentTiers: Record<string, Tier>
  globalTier: Tier
  globalValue: number
  penalties: string[]
}

export function analyzeTiers(
  build: ResolvedBuild,
  ranks: Map<string, Tier>,
  thermal: Pick<ThermalReport, 'throttlingRisk'>,
  power: Pick<PowerReport, 'sustainedOk'>,
): TierReport {
  const componentTiers: Record<string, Tier> = {}
  let weighted = 0
  let weightSum = 0
  for (const slot of BUILD_SLOTS) {
    const item = build[slot]
    if (!item) continue
    const tier = ranks.get(item.slug) ?? item.baseTier
    componentTiers[slot] = tier
    weighted += SLOT_WEIGHT[slot] * TIER_VALUE[tier]
    weightSum += SLOT_WEIGHT[slot]
  }

  const penalties: string[] = []
  let value = weightSum > 0 ? weighted / weightSum : 1
  const gpuTier = componentTiers.gpu ? TIER_VALUE[componentTiers.gpu] : null
  const psuTier = componentTiers.psu ? TIER_VALUE[componentTiers.psu] : null
  const cpuTier = componentTiers.cpu ? TIER_VALUE[componentTiers.cpu] : null
  const coolerTier = componentTiers.cooler ? TIER_VALUE[componentTiers.cooler] : null

  if (gpuTier != null && psuTier != null && gpuTier - psuTier >= 4) {
    value -= 1.2
    penalties.push('Asimetría severa entre GPU y fuente.')
  } else if (gpuTier != null && psuTier != null && gpuTier - psuTier >= 3) {
    value -= 0.6
    penalties.push('La fuente queda por detrás de la GPU.')
  }
  if (thermal.throttlingRisk) {
    value -= 0.8
    penalties.push('Riesgo de throttling térmico.')
  }
  if (build.psu && !power.sustainedOk) {
    value -= 1
    penalties.push('La fuente no cubre la carga sostenida.')
  }
  if (cpuTier != null && coolerTier != null && cpuTier - coolerTier >= 3) {
    value -= 0.4
    penalties.push('El disipador no acompaña al procesador.')
  }

  return {
    componentTiers,
    globalTier: tierFromValue(value),
    globalValue: Math.round(value * 100) / 100,
    penalties,
  }
}
