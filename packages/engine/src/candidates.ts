import { BUILD_SLOTS, type BuildSlot, type CatalogItem, type Issue, type ResolvedBuild } from '@pc/shared'
import { checkCompatibility } from './compatibility'
import type { EngineContext } from './context'

export interface CandidateVerdict {
  status: 'compatible' | 'warning' | 'incompatible'
  issues: Issue[]
}

export function evaluateCandidates(
  build: ResolvedBuild,
  slot: BuildSlot,
  catalog: CatalogItem[],
  context: EngineContext,
): Map<string, CandidateVerdict> {
  const verdicts = new Map<string, CandidateVerdict>()
  for (const candidate of catalog) {
    if (candidate.type !== slot) continue
    const next: ResolvedBuild = { ...build, [slot]: candidate }
    const issues = checkCompatibility(next, context).filter((issue) =>
      issue.componentSlugs.includes(candidate.slug),
    )
    const status = issues.some((issue) => issue.severity === 'error')
      ? 'incompatible'
      : issues.some((issue) => issue.severity === 'warning')
        ? 'warning'
        : 'compatible'
    verdicts.set(candidate.slug, { status, issues })
  }
  return verdicts
}

export function invalidatedSlots(build: ResolvedBuild, context: EngineContext): BuildSlot[] {
  const errors = checkCompatibility(build, context).filter((issue) => issue.severity === 'error')
  return BUILD_SLOTS.filter((slot) => {
    const item = build[slot]
    return !!item && errors.some((issue) => issue.componentSlugs.includes(item.slug))
  })
}
