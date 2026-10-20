import cors from '@fastify/cors'
import { createDb, PRESETS, savedBuilds } from '@pc/db'
import { analyzeBuild, rankCatalog, resolveBuild } from '@pc/engine'
import { BENCHMARK_PROFILES, MARKET_CATEGORIES, buildSelectionSchema } from '@pc/shared'
import { eq } from 'drizzle-orm'
import Fastify from 'fastify'
import { z } from 'zod'
import { loadCatalog } from './catalog'
import { resolveStoreUrl, searchMarket } from './market'

const app = Fastify({ logger: true })
await app.register(cors, { origin: true })

const { db, client } = createDb()
let cache: Awaited<ReturnType<typeof loadCatalog>> | null = null

async function catalog(refresh = false) {
  if (!cache || refresh) cache = await loadCatalog(db)
  return cache
}

app.get('/health', async () => ({ ok: true }))

app.get('/components', async (request) => {
  const query = z
    .object({
      type: z.string().optional(),
      q: z.string().optional(),
      manufacturer: z.string().optional(),
      yearFrom: z.coerce.number().optional(),
      yearTo: z.coerce.number().optional(),
      limit: z.coerce.number().int().min(1).max(1000).default(500),
      offset: z.coerce.number().int().min(0).default(0),
      refresh: z.string().optional(),
    })
    .parse(request.query)

  const { items } = await catalog(query.refresh === '1')
  const q = query.q?.toLowerCase()
  const filtered = items.filter((item) => {
    if (query.type && item.type !== query.type) return false
    if (query.manufacturer && item.manufacturer.toLowerCase() !== query.manufacturer.toLowerCase()) return false
    if (query.yearFrom && item.releaseYear < query.yearFrom) return false
    if (query.yearTo && item.releaseYear > query.yearTo) return false
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) ||
      item.slug.includes(q) ||
      item.manufacturer.toLowerCase().includes(q) ||
      String(item.releaseYear).includes(q)
    )
  })
  return {
    total: filtered.length,
    items: filtered.slice(query.offset, query.offset + query.limit),
  }
})

app.get('/components/:slug', async (request, reply) => {
  const { slug } = request.params as { slug: string }
  const { items } = await catalog()
  const item = items.find((entry) => entry.slug === slug)
  if (!item) return reply.code(404).send({ error: 'Componente no encontrado' })
  return item
})

app.get('/platforms', async () => {
  const { platforms } = await catalog()
  return platforms
})

app.get('/profiles', async () => BENCHMARK_PROFILES)

app.get('/presets', async () => PRESETS)

app.get('/market/go', async (request, reply) => {
  const { id } = z.object({ id: z.string().max(80) }).parse(request.query)
  try {
    const target = await resolveStoreUrl(id)
    if (!target) return reply.code(404).send({ error: 'Esa oferta no tiene página en la tienda.' })
    return reply.redirect(target)
  } catch (error) {
    request.log.error(error)
    return reply.code(502).send({ error: 'No se pudo abrir la página de la tienda.' })
  }
})

app.get('/market', async (request, reply) => {
  const query = z
    .object({
      category: z.enum(MARKET_CATEGORIES),
      q: z.string().max(80).optional(),
      page: z.coerce.number().int().min(1).max(30).default(1),
    })
    .parse(request.query)
  try {
    return await searchMarket(query.category, query.q ?? '', query.page)
  } catch (error) {
    request.log.error(error)
    return reply.code(502).send({ error: 'No se pudieron leer las ofertas de HardGamers.' })
  }
})

app.post('/builds/analyze', async (request, reply) => {
  const parsed = buildSelectionSchema.safeParse(request.body)
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() })
  const { items, platforms } = await catalog()
  const build = resolveBuild(parsed.data, items)
  return analyzeBuild(build, items, platforms)
})

app.get('/tiers', async (request) => {
  const query = z
    .object({
      type: z.string().optional(),
      yearFrom: z.coerce.number().optional(),
      yearTo: z.coerce.number().optional(),
    })
    .parse(request.query)
  const { items } = await catalog()
  const ranks = rankCatalog(items)
  return items
    .filter((item) => !query.type || item.type === query.type)
    .filter((item) => !query.yearFrom || item.releaseYear >= query.yearFrom)
    .filter((item) => !query.yearTo || item.releaseYear <= query.yearTo)
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      manufacturer: item.manufacturer,
      type: item.type,
      releaseYear: item.releaseYear,
      priceUsd: item.priceUsd,
      baseTier: item.baseTier,
      computedTier: ranks.get(item.slug) ?? item.baseTier,
      performanceScore: item.performanceScore,
    }))
})

app.get('/compare', async (request, reply) => {
  const query = z.object({ a: z.string(), b: z.string() }).parse(request.query)
  const { items } = await catalog()
  const ranks = rankCatalog(items)
  const left = items.find((item) => item.slug === query.a)
  const right = items.find((item) => item.slug === query.b)
  if (!left || !right) return reply.code(404).send({ error: 'Algún componente no existe' })
  return {
    a: { ...left, computedTier: ranks.get(left.slug) },
    b: { ...right, computedTier: ranks.get(right.slug) },
  }
})

app.post('/builds', async (request, reply) => {
  const body = z.object({ name: z.string().min(1).max(160) }).and(buildSelectionSchema).safeParse(request.body)
  if (!body.success) return reply.code(400).send({ error: body.error.flatten() })
  const { name, ...selection } = body.data
  const [row] = await db
    .insert(savedBuilds)
    .values({ name, payload: selection })
    .returning({ id: savedBuilds.id, name: savedBuilds.name, createdAt: savedBuilds.createdAt })
  return row
})

app.get('/builds/:id', async (request, reply) => {
  const { id } = request.params as { id: string }
  const [row] = await db.select().from(savedBuilds).where(eq(savedBuilds.id, id))
  if (!row) return reply.code(404).send({ error: 'Build no encontrado' })
  return row
})

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

app.addHook('onClose', async () => {
  await client.end()
})

await app.listen({ port, host })
