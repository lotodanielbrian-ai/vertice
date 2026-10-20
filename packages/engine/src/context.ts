import type { BuildSelection, CatalogItem, ResolvedBuild } from '@pc/shared'

export interface EngineContext {
  /** Pares válidos socket/chipset. Si está vacío, esa regla no se evalúa. */
  socketChipsets: { socketName: string; chipsetName: string }[]
}

export const EMPTY_CONTEXT: EngineContext = { socketChipsets: [] }

export function resolveBuild(selection: BuildSelection, catalog: CatalogItem[]): ResolvedBuild {
  const bySlug = new Map(catalog.map((item) => [item.slug, item]))
  const pick = (slug: string | null | undefined) => (slug ? (bySlug.get(slug) ?? null) : null)
  return {
    cpu: pick(selection.cpu),
    gpu: pick(selection.gpu),
    motherboard: pick(selection.motherboard),
    ram: pick(selection.ram),
    psu: pick(selection.psu),
    case: pick(selection.case),
    storage: pick(selection.storage),
    cooler: pick(selection.cooler),
  }
}

export function emptyBuild(): ResolvedBuild {
  return {
    cpu: null,
    gpu: null,
    motherboard: null,
    ram: null,
    psu: null,
    case: null,
    storage: null,
    cooler: null,
  }
}
