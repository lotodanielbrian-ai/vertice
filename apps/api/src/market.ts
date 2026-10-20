import { MARKET_CATEGORIES, type MarketCategory, type MarketOffer, type MarketPage } from '@pc/shared'

const ORIGIN = 'https://www.hardgamers.com.ar'
const TTL_MS = 60 * 60 * 1000
const TARGET = 16
const EXTRA_PAGES = 3

const cache = new Map<string, { at: number; html: string }>()
const OUTBOUND = 2
let outbound = 0
const outboundQueue: Array<() => void> = []

function acquireOutbound(): Promise<void> {
  if (outbound < OUTBOUND) {
    outbound += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    outboundQueue.push(() => {
      outbound += 1
      resolve()
    })
  })
}

function releaseOutbound(): void {
  outbound -= 1
  const next = outboundQueue.shift()
  if (next) next()
}

interface Spec {
  hg?: string
  defaultText: string
  accept: (name: string) => boolean
}

const notAComputer = /notebook|laptop|pc gamer|pc armada|pc eco/i

const SPECS: Record<MarketCategory, Spec> = {
  motherboard: {
    hg: 'motherboards',
    defaultText: 'mother',
    accept: (name) => /\bmother\b/i.test(name),
  },
  ram: {
    hg: 'memorias-ram',
    defaultText: 'memoria ddr',
    accept: (name) => /ddr[345]/i.test(name) && /memoria|\bram\b/i.test(name) && !/micro\s*sd|\bssd\b|\bnvme\b/i.test(name),
  },
  cooler: {
    hg: 'refrigeracion',
    defaultText: 'cooler cpu',
    accept: (name) => /(water|aio|disipador|cooler)/i.test(name) && !/gabinete|\bfan\b|kit\s*x/i.test(name),
  },
  storage: {
    hg: 'almacenamiento',
    defaultText: 'ssd',
    accept: (name) => /\b(ssd|nvme|hdd|disco)\b/i.test(name) && !/\bddr[345]\b|carcasa|adaptador|placa pci/i.test(name),
  },
  psu: {
    hg: 'fuentes',
    defaultText: 'fuente',
    accept: (name) => {
      const watts = psuWatts(name)
      return /\bfuente\b/i.test(name) && watts != null && watts >= 300 && !/notebook|cargador/i.test(name)
    },
  },
  case: {
    hg: 'gabinetes',
    defaultText: 'gabinete',
    accept: (name) => /\bgabinete\b/i.test(name) && !/\b(tornillo|fuente)\b|kit\s*x\s*\d|cooler gabinete/i.test(name),
  },
  monitor: {
    hg: 'monitores',
    defaultText: 'monitor',
    accept: (name) => /\bmonitor\b/i.test(name) && !/soporte|brazo/i.test(name),
  },
  peripheral: {
    hg: 'teclados',
    defaultText: 'teclado',
    accept: (name) => /(teclado|mouse|auricular)/i.test(name),
  },
  cpu: {
    hg: 'microprocesadores',
    defaultText: 'procesador',
    accept: (name) => /(ryzen|athlon|procesador|core\s*(i[3579]|ultra)|celeron|pentium)/i.test(name) && !notAComputer.test(name) && !/\bcpu\s*cooler\b|\bdisipador\b|\bpasta\b|\bgrasa\b/i.test(name),
  },
  gpu: {
    hg: 'placas-de-video',
    defaultText: 'placa',
    accept: (name) => /(rtx|gtx|\brx\s*\d|geforce|radeon|placa de video|\barc\s*[ab]\d)/i.test(name) && !notAComputer.test(name),
  },
}

function priceArs(raw: string): number {
  const trimmed = raw.trim()
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) return Number(trimmed.replace(/\./g, ''))
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value <= 0) return 0
  // HardGamers a veces publica 113 cuando el precio de la tienda es $ 113.000.
  if (value < 1000) return Math.round(value * 1000)
  return Math.round(value)
}

function psuWatts(name: string): number | null {
  const values = [...name.matchAll(/(\d{3,4})\s*w\b/gi)].map((match) => Number(match[1]))
  const useful = values.filter((value) => value >= 300 && value <= 2000)
  return useful.length > 0 ? Math.max(...useful) : null
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter((token) => token.length >= 2)
}

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d+)\s+(gb|tb)/g, '$1$2')
}

function tokenPattern(token: string): RegExp {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // "1200" también tiene que coincidir con LGA1200 o S1200.
  const body = /^\d{3,4}$/.test(token) ? `(?:lga|s)?${escaped}` : escaped
  return new RegExp(`(?:^|[^a-z0-9])${body}(?:[^a-z0-9]|$)`, 'i')
}

function matchesQuery(name: string, query: string): boolean {
  const folded = fold(name)
  return tokens(fold(query)).every((token) => tokenPattern(token).test(folded))
}

export function parseOffers(html: string): MarketOffer[] {
  const offers: MarketOffer[] = []
  for (const match of html.matchAll(/<article\b[^>]*class="One-Bit-Product"[\s\S]*?<\/article>/gi)) {
    const block = match[0]
    const id = /href="\/product\/([^"]+)"/.exec(block)?.[1]
    const name = decode(/itemprop="name">\s*([^<]+)/.exec(block)?.[1] ?? '')
    const price = priceArs(/itemprop="price"\s+content="([\d.]+)"/.exec(block)?.[1] ?? '')
    const image = /<img\s+src="([^"]+)"[^>]*itemprop="image"/.exec(block)?.[1] ?? null
    const store = decode(/class="store">\s*([^<]+)/.exec(block)?.[1] ?? '')
    if (!id || !name || !Number.isFinite(price) || price <= 0) continue
    offers.push({
      id,
      name,
      priceArs: Math.round(price),
      imageUrl: image == null ? null : image.startsWith('http') ? image : `${ORIGIN}${image}`,
      store: store || 'Tienda',
      url: `/api/market/go?id=${encodeURIComponent(id)}`,
      available: !/OutOfStock/.test(block),
    })
  }
  return offers
}

function hasNext(html: string, page: number): boolean {
  return html.includes(`page=${page + 1}`)
}

function searchUrl(category: MarketCategory, text: string, page: number): string {
  const spec = SPECS[category]
  const params = new URLSearchParams({ text })
  const typedSearch = category === 'peripheral' && text !== spec.defaultText
  if (spec.hg && !typedSearch) params.set('category', spec.hg)
  if (page > 1) params.set('page', String(page))
  return `${ORIGIN}/search?${params}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getHtml(url: string): Promise<string> {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.html
  let lastStatus = 0
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await delay(1500 * attempt)
    await acquireOutbound()
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Vertice/0.1',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(12000),
      })
      if (response.status === 429 || response.status === 503) {
        lastStatus = response.status
        continue
      }
      if (!response.ok) throw new Error(`HardGamers respondió ${response.status}`)
      const html = await response.text()
      cache.set(url, { at: Date.now(), html })
      if (cache.size > 200) {
        const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (oldest) cache.delete(oldest[0])
      }
      return html
    } finally {
      releaseOutbound()
    }
  }
  throw new Error(`HardGamers respondió ${lastStatus || 429}`)
}

const OFFER_ID = /^[a-z0-9_-]+:[a-z0-9_-]+$/i
const storeLinks = new Map<string, { at: number; url: string }>()

function storeUrlFrom(html: string): string | null {
  const candidates = [...html.matchAll(/href="(https?:\/\/[^"]+)"[^>]*itemprop="url"/gi)].map((match) => decode(match[1]))
  const external = candidates.find((value) => {
    try {
      return !new URL(value).hostname.endsWith('hardgamers.com.ar')
    } catch {
      return false
    }
  })
  if (!external) return null
  const url = new URL(external)
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key)
  }
  return url.toString()
}

export async function resolveStoreUrl(id: string): Promise<string | null> {
  if (!OFFER_ID.test(id)) return null
  const hit = storeLinks.get(id)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.url
  const html = await getHtml(`${ORIGIN}/product/${id}`)
  const url = storeUrlFrom(html)
  if (!url) return null
  storeLinks.set(id, { at: Date.now(), url })
  return url
}

export async function searchMarket(category: MarketCategory, query: string, startPage: number): Promise<MarketPage> {
  if (!MARKET_CATEGORIES.includes(category)) return { offers: [], nextPage: null }
  const spec = SPECS[category]
  const q = query.trim()
  const text = q || spec.defaultText
  const found = new Map<string, MarketOffer>()
  let page = startPage
  let more = false
  while (found.size < TARGET && page < startPage + EXTRA_PAGES) {
    const html = await getHtml(searchUrl(category, text, page))
    for (const offer of parseOffers(html)) {
      if (!spec.accept(offer.name)) continue
      if (q && !matchesQuery(offer.name, q)) continue
      found.set(offer.id, offer)
    }
    more = hasNext(html, page)
    page += 1
    if (!more) break
  }
  const offers = [...found.values()].sort((a, b) => a.priceArs - b.priceArs)
  return { offers, nextPage: more ? page : null }
}
