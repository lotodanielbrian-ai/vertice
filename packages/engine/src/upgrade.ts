import type { BuildSlot, CatalogItem, ResolvedBuild } from '@pc/shared'
import { checkCompatibility } from './compatibility'
import type { EngineContext } from './context'
import type { BottleneckReport } from './bottleneck'
import type { PowerReport } from './power'
import type { ThermalReport } from './thermal'

export interface UpgradeSuggestion {
  slot: BuildSlot
  fromSlug: string | null
  toSlug: string
  toName: string
  deltaScore: number
  deltaPrice: number | null
  costPerScore: number | null
  perfPerWatt: number | null
  reason: string
}

function swapped(build: ResolvedBuild, slot: BuildSlot, item: CatalogItem): ResolvedBuild {
  return { ...build, [slot]: item }
}

function hasErrors(build: ResolvedBuild, context: EngineContext): boolean {
  return checkCompatibility(build, context).some(
    (issue) => issue.severity === 'error' || issue.code === 'GPU_BUS_UNKNOWN' || issue.code === 'BUS_PHYSICAL',
  )
}

function roi(current: CatalogItem | null, candidate: CatalogItem): UpgradeSuggestion | null {
  if (!current || candidate.slug === current.slug) return null
  const deltaScore = candidate.performanceScore - current.performanceScore
  if (deltaScore <= 0) return null
  const deltaPrice =
    candidate.priceUsd != null && current.priceUsd != null
      ? candidate.priceUsd - current.priceUsd
      : null
  const costPerScore = deltaPrice != null && deltaPrice > 0 ? deltaPrice / deltaScore : null
  const perfPerWatt = candidate.tdpWatts > 0 ? candidate.performanceScore / candidate.tdpWatts : null
  return {
    slot: candidate.type as BuildSlot,
    fromSlug: current.slug,
    toSlug: candidate.slug,
    toName: candidate.name,
    deltaScore,
    deltaPrice,
    costPerScore,
    perfPerWatt,
    reason: '',
  }
}

export function suggestUpgrades(
  build: ResolvedBuild,
  catalog: CatalogItem[],
  context: EngineContext,
  bottleneck: BottleneckReport,
  power: PowerReport,
  thermal: ThermalReport,
): UpgradeSuggestion[] {
  const suggestions: UpgradeSuggestion[] = []
  const dominant = bottleneck.dominant
  const focus: BuildSlot | null =
    dominant?.limiting === 'cpu' ? 'cpu' : dominant?.limiting === 'gpu' ? 'gpu' : null

  if (focus) {
    const current = build[focus]
    const ranked = catalog
      .filter((item) => item.type === focus)
      .map((item) => roi(current, item))
      .filter((item): item is UpgradeSuggestion => item != null)
      .filter((item) => {
        const candidate = catalog.find((entry) => entry.slug === item.toSlug)
        if (!candidate) return false
        return !hasErrors(swapped(build, focus, candidate), context)
      })
      .sort((a, b) => {
        if (a.costPerScore == null && b.costPerScore == null) return b.deltaScore - a.deltaScore
        if (a.costPerScore == null) return 1
        if (b.costPerScore == null) return -1
        return a.costPerScore - b.costPerScore
      })
      .slice(0, 3)
      .map((item) => ({
        ...item,
        reason: `Mayor retorno sobre el cuello de ${focus.toUpperCase()} en ${dominant?.profileName ?? 'el perfil dominante'}.`,
      }))
    suggestions.push(...ranked)

    const efficient = catalog
      .filter((item) => item.type === focus && item.tdpWatts > 0 && item.performanceScore > (current?.performanceScore ?? 0))
      .filter((item) => !hasErrors(swapped(build, focus, item), context))
      .sort((a, b) => b.performanceScore / b.tdpWatts - a.performanceScore / a.tdpWatts)[0]
    if (efficient && !suggestions.some((item) => item.toSlug === efficient.slug)) {
      const row = roi(current, efficient)
      if (row) {
        suggestions.push({
          ...row,
          reason: 'Mejor rendimiento por watt entre los candidatos compatibles.',
        })
      }
    }
  }

  if (build.psu && !power.sustainedOk) {
    const better = catalog
      .filter(
        (item) =>
          item.type === 'psu' &&
          (item.psu?.wattage ?? 0) >= power.recommendedPsuWatts &&
          item.slug !== build.psu?.slug,
      )
      .filter((item) => !hasErrors(swapped(build, 'psu', item), context))
      .sort((a, b) => (a.priceUsd ?? 9999) - (b.priceUsd ?? 9999))[0]
    if (better) {
      suggestions.push({
        slot: 'psu',
        fromSlug: build.psu.slug,
        toSlug: better.slug,
        toName: better.name,
        deltaScore: better.performanceScore - build.psu.performanceScore,
        deltaPrice:
          better.priceUsd != null && build.psu.priceUsd != null
            ? better.priceUsd - build.psu.priceUsd
            : null,
        costPerScore: null,
        perfPerWatt: null,
        reason: `Cubre los ${power.recommendedPsuWatts} W recomendados y entra en el gabinete.`,
      })
    }
  }

  if (thermal.throttlingRisk && build.cooler && build.cpu) {
    const required = build.cpu.cpu?.peakTransientTdpWatts ?? build.cpu.tdpWatts
    const better = catalog
      .filter(
        (item) =>
          item.type === 'cooler' &&
          (item.cooler?.tdpMax ?? 0) >= required &&
          item.slug !== build.cooler?.slug,
      )
      .filter((item) => !hasErrors(swapped(build, 'cooler', item), context))
      .sort((a, b) => (a.priceUsd ?? 9999) - (b.priceUsd ?? 9999))[0]
    if (better) {
      suggestions.push({
        slot: 'cooler',
        fromSlug: build.cooler.slug,
        toSlug: better.slug,
        toName: better.name,
        deltaScore: better.performanceScore - build.cooler.performanceScore,
        deltaPrice:
          better.priceUsd != null && build.cooler.priceUsd != null
            ? better.priceUsd - build.cooler.priceUsd
            : null,
        costPerScore: null,
        perfPerWatt: null,
        reason: `Disipa al menos ${required} W y respeta socket y alto del gabinete.`,
      })
    }
  }

  return suggestions
}
