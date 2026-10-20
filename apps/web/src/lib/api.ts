import type { CatalogItem, LegendaryPreset } from '@pc/shared'

export interface PlatformMatrix {
  socketChipsets: { socketName: string; chipsetName: string }[]
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const response = await fetch('/api/components?limit=1000')
  if (!response.ok) throw new Error('No se pudo cargar el catálogo')
  const body = (await response.json()) as { items: CatalogItem[] }
  return body.items
}

export async function fetchPlatforms(): Promise<PlatformMatrix> {
  const response = await fetch('/api/platforms')
  if (!response.ok) throw new Error('No se pudo cargar la matriz de sockets')
  return (await response.json()) as PlatformMatrix
}

export async function fetchPresets(): Promise<LegendaryPreset[]> {
  const response = await fetch('/api/presets')
  if (!response.ok) throw new Error('No se pudieron cargar los presets')
  return (await response.json()) as LegendaryPreset[]
}
