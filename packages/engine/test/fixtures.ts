import type { CatalogItem, ResolvedBuild } from '@pc/shared'
import { emptyBuild } from '../src/context'

export function item(
  overrides: Partial<CatalogItem> & Pick<CatalogItem, 'slug' | 'type' | 'name'>,
): CatalogItem {
  return {
    id: overrides.slug,
    manufacturer: 'Test',
    releaseYear: 2024,
    priceUsd: 100,
    baseTier: 'C',
    tdpWatts: 65,
    performanceScore: 50,
    ...overrides,
  }
}

export function build(partial: Partial<ResolvedBuild> = {}): ResolvedBuild {
  return { ...emptyBuild(), ...partial }
}
