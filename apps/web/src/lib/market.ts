import type { CatalogItem, MarketCategory, MarketPage } from '@pc/shared'

export async function fetchMarket(category: MarketCategory, q: string, page: number): Promise<MarketPage> {
  const params = new URLSearchParams({ category, page: String(page) })
  if (q.trim()) params.set('q', q.trim())
  const response = await fetch(`/api/market?${params}`)
  if (!response.ok) throw new Error('No se pudieron leer las ofertas')
  return (await response.json()) as MarketPage
}

/** Token corto para buscar el modelo en las tiendas, sin el texto comercial del catálogo. */
export function marketQuery(item: CatalogItem): string {
  const name = item.name
  if (item.type === 'gpu') {
    const match = name.match(/\b(?:rtx|gtx)\s*\d{3,4}(?:\s*(?:ti|super))?|\brx\s*\d{3,4}(?:\s*(?:xtx|xt|gre))?|\barc\s*[ab]\d{3}/i)
    if (match) return match[0].replace(/\s+/g, ' ')
  }
  if (item.type === 'cpu') {
    const x3d = name.match(/\b(\d{3,4}x3d)\b/i)
    if (x3d) return x3d[1]
    const ultra = name.match(/ultra\s*\d\s*(\d{3}[a-z]*)/i)
    if (ultra) return ultra[1]
    const intel = name.match(/\bi[3579]-(\d{4,5}[a-z]*)/i)
    if (intel) return intel[1]
    const model = name.match(/\b(\d{4}[a-z]{0,2})\b/i)
    if (model) return model[1]
  }
  return name
}

function cpuKey(name: string): string | null {
  const x3d = /\b(\d{3,4}x3d)\b/i.exec(name)
  if (x3d) return x3d[1].toLowerCase()
  const ultra = /ultra\s*(\d)\s*(\d{3}[a-z]*)/i.exec(name)
  if (ultra) return `ultra${ultra[1]}${ultra[2].toLowerCase()}`
  const intel = /\bi([3579])[-\s]?(\d{4,5}[a-z]*)/i.exec(name)
  if (intel) return `i${intel[1]}${intel[2].toLowerCase()}`
  const model = /\b(\d{4}[a-z]{0,2})\b/i.exec(name)
  if (model) return model[1].toLowerCase()
  return null
}

export function matchCatalogCpu(items: CatalogItem[], name: string): CatalogItem | null {
  const key = cpuKey(name)
  if (!key) return null
  for (const item of items) {
    if (item.type === 'cpu' && cpuKey(item.name) === key) return item
  }
  return null
}

export function matchCatalogGpu(items: CatalogItem[], name: string): CatalogItem | null {
  const haystack = name.toLowerCase()
  let best: { item: CatalogItem; length: number } | null = null
  for (const item of items) {
    if (item.type !== 'gpu') continue
    const token = marketQuery(item).toLowerCase()
    if (token.length < 4 || !haystack.includes(token)) continue
    if (!best || token.length > best.length) best = { item, length: token.length }
  }
  return best?.item ?? null
}

export function formatArs(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}
