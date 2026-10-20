import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const outDir = resolve(root, 'apps/web/public/images/components')
const manifestPath = resolve(root, 'packages/db/seed-data/images-manifest.json')
const cachePath = resolve(root, 'packages/db/seed-data/images-cache.json')
const overridesPath = resolve(root, 'tools/image-fetcher/image-overrides.json')
const extraPath = resolve(root, 'tools/image-fetcher/extra-components.json')
const USER_AGENT = 'HardwareNexus/0.1 (local pc builder; educational catalog)'
const API = 'https://commons.wikimedia.org/w/api.php'
const MARKERS = ['xtx', 'x3d', 'super', 'ultra', 'gre', 'xt', 'ti']

const retryMisses = process.argv.includes('--retry-misses')
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length)
const only = onlyArg ? new Set(onlyArg.split(',').map((part) => part.trim()).filter(Boolean)) : null
const slugsArg = process.argv.find((arg) => arg.startsWith('--slugs='))?.slice('--slugs='.length)
const slugFilter = slugsArg ? new Set(slugsArg.split(',').map((part) => part.trim()).filter(Boolean)) : null

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms))

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf8'))
}

function cleanName(name) {
  return name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(GB|MB|TB)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function modelTokens(name) {
  const found = new Set()
  for (const match of name.matchAll(/(?:^|[^0-9])(\d{3,5})(?=[^0-9]|$)/g)) found.add(match[1])
  return [...found]
}

function markersIn(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
  const glued = text.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const found = new Set()
  for (const marker of MARKERS) {
    const word = new RegExp(`\\b${marker}\\b`)
    const stuck = new RegExp(`\\d${marker}(?:\\d|$)`)
    if (word.test(normalized) || stuck.test(glued)) found.add(marker)
  }
  if (found.has('xtx')) found.delete('xt')
  return found
}

function sameMarkers(title, name) {
  const left = markersIn(title)
  const right = markersIn(name)
  if (left.size !== right.size) return false
  for (const marker of right) if (!left.has(marker)) return false
  return true
}

function conflictingModel(title, name) {
  const wanted = new Set(modelTokens(name))
  const file = title.toLowerCase()
  const labeled = /(?:rtx|gtx|rx|arc|ryzen|athlon|phenom|pentium|i[3579])\s*-?\s*(\d{3,5})/g
  for (const match of file.matchAll(labeled)) {
    if (!wanted.has(match[1])) return true
  }
  for (const match of file.matchAll(/\ba(\d{3,4})m?\b/g)) {
    if (!wanted.has(match[1])) return true
  }
  if (/\bvs\b|versus/.test(file)) return true
  const sibling = file.match(/(?:rtx|gtx|rx|arc)\s*-?\s*\d{3,5}[^0-9]{0,8}(\d{3,5})/i)
  if (sibling && !wanted.has(sibling[1])) return true
  return false
}

function isFreeLicense(meta) {
  const blob = [meta?.LicenseShortName?.value, meta?.License?.value, meta?.UsageTerms?.value]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (!blob) return false
  if (/non-?commercial|\bnc\b|no ?deriv|noderiv/.test(blob)) return false
  return /cc0|cc[- ]?by|public domain|\bpd\b|gfdl/.test(blob)
}

function hasToken(file, token) {
  return new RegExp(`(?:^|[^0-9])${token}(?:[^0-9]|$)`).test(file)
}

function titleMatches(title, name) {
  const file = title.replace(/^file:/i, '').toLowerCase()
  if (/logo|icon|diagram|flag|map\b|\.svg|schematic|adapter|cable|pinout|\bchip\b|die shot/.test(file)) return false
  if (!/geforce|radeon|nvidia|\bamd\b|\bintel\b|ryzen|\barc\b|processor|graphics/.test(file)) return false
  if (conflictingModel(title, name)) return false
  if (!sameMarkers(title, name)) return false
  const tokens = modelTokens(name).sort((a, b) => b.length - a.length || Number(b) - Number(a))
  if (tokens[0] && !hasToken(file, tokens[0])) return false
  const ignore = new Set(['the', 'and', 'with', 'intel', 'amd', 'nvidia', 'ati', 'asus', 'msi', 'geforce', 'radeon', 'core', 'pentium', 'arc'])
  const words = cleanName(name).toLowerCase().split(' ').filter((word) => word.length > 2 && !ignore.has(word) && !/^\d+$/.test(word))
  const hits = words.filter((word) => file.includes(word.toLowerCase()))
  if (tokens.length > 0) return hits.length >= 1 || words.length === 0
  return hits.length >= Math.min(2, Math.max(words.length, 1))
}

function rank(page, name) {
  const title = page.title.toLowerCase()
  let score = 0
  if (/\.jpe?g/.test(title)) score += 6
  else if (/\.png|\.webp/.test(title)) score += 3
  if (/\d{2}\.\d{2}\.\d{2}/.test(title)) score -= 7
  if (/vergleich|comparison|\bvs\b|review|unboxing|评测|обзор/.test(title)) score -= 3
  if (title.length < 80) score += 2
  const info = page.imageinfo?.[0]
  const width = info?.thumbwidth ?? info?.width ?? 0
  if (width >= 480) score += 2
  return score
}

async function commons(params, attempt = 0) {
  const url = new URL(API)
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT } })
  if (response.status === 429 && attempt < 5) {
    await sleep(12000 * (attempt + 1))
    return commons(params, attempt + 1)
  }
  if (!response.ok) throw new Error(`Commons ${response.status}`)
  return response.json()
}

function pagesOf(data) {
  const pages = data?.query?.pages ?? {}
  return Object.values(pages).filter((page) => page.imageinfo?.[0] && !page.missing)
}

async function search(query) {
  const data = await commons({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '640',
  })
  return pagesOf(data)
}

async function categoryFiles(category) {
  const data = await commons({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: category,
    gcmtype: 'file',
    gcmlimit: '20',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '640',
  })
  return pagesOf(data)
}

async function byTitle(title) {
  const data = await commons({
    action: 'query',
    titles: title.startsWith('File:') ? title : `File:${title}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '640',
  })
  return pagesOf(data)[0] ?? null
}

function pick(pages, name) {
  const ranked = pages
    .map((page) => {
      const info = page.imageinfo[0]
      const mime = info.mime ?? ''
      const okType = /jpeg|png|webp/.test(mime)
      const free = isFreeLicense(info.extmetadata)
      const match = titleMatches(page.title, name)
      return { page, info, ok: okType && free && match, score: rank(page, name) }
    })
    .filter((row) => row.ok)
    .sort((a, b) => b.score - a.score)
  return ranked[0] ?? null
}

function searchQueries(component) {
  const base = cleanName(component.name)
  const queries = [base]
  if (component.slug.startsWith('g_')) queries.push(`${base} graphics card`)
  if (component.slug.startsWith('c_')) queries.push(`${base} processor`)
  return [...new Set(queries)]
}

function categoriesFor(component) {
  const name = component.name
  const categories = []
  const rtx = name.match(/rtx\s*(\d{3,4})(?:\s*(ti))?(?:\s*(super))?/i)
  if (rtx) {
    const ti = rtx[2] ? ' Ti' : ''
    const superMark = rtx[3] ? ' Super' : ''
    categories.push(`Category:NVIDIA GeForce RTX ${rtx[1]}${ti}${superMark}`)
    categories.push(`Category:Nvidia GeForce ${rtx[1][0]}0 series video cards`)
  }
  const gtx = name.match(/gtx\s*(\d{3,4})(?:\s*(ti))?/i)
  if (gtx) categories.push(`Category:NVIDIA GeForce GTX ${gtx[1]}${gtx[2] ? ' Ti' : ''}`)
  if (/radeon rx 7/i.test(name)) categories.push('Category:AMD Radeon RX 7000 series video cards')
  if (/radeon rx 9/i.test(name)) categories.push('Category:AMD Radeon RX 9000 series video cards')
  if (/radeon rx 6/i.test(name)) categories.push('Category:AMD Radeon RX 6000 series video cards')
  const arc = name.match(/arc\s+([ab]\d{3})/i)
  if (arc) {
    categories.push(`Category:Intel Arc ${arc[1].toUpperCase()}`)
    categories.push(arc[1].toUpperCase().startsWith('B') ? 'Category:Intel Arc B series' : 'Category:Intel Arc A series')
  }
  const ryzen = name.match(/ryzen\s+\d\s+[0-9a-z]+/i)
  if (ryzen) categories.push(`Category:AMD ${ryzen[0].replace(/\s+/g, ' ')}`)
  const core = name.match(/core\s+(?:ultra\s+)?(?:i[3579]-\d{4,5}\w*|\d\s+\d{3}\w*)/i)
  if (core) categories.push(`Category:Intel ${core[0].replace(/\s+/g, ' ')}`)
  return [...new Set(categories)]
}

function wanted(slug) {
  if (slugFilter && !slugFilter.has(slug)) return false
  if (!only) return slug.startsWith('g_') || slug.startsWith('c_') || !retryMisses
  if (only.has('gpu') && slug.startsWith('g_')) return true
  if (only.has('cpu') && slug.startsWith('c_')) return true
  if (only.has('all')) return true
  return false
}

async function download(url, dest) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Descarga ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  writeFileSync(dest, bytes)
  return bytes.length
}

function loadComponents() {
  const prototype = loadJson(resolve(root, 'packages/db/seed-data/prototype.json'), { components: [] })
  const extras = loadJson(extraPath, [])
  const expansion = existsSync(resolve(root, 'packages/db/src/expansion.ts'))
    ? readFileSync(resolve(root, 'packages/db/src/expansion.ts'), 'utf8')
    : ''
  const bySlug = new Map()
  for (const item of prototype.components ?? []) {
    if (item?.slug && item?.name) bySlug.set(item.slug, { slug: item.slug, name: item.name })
  }
  for (const match of expansion.matchAll(/slug:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) {
    bySlug.set(match[1], { slug: match[1], name: match[2] })
  }
  for (const item of extras) bySlug.set(item.slug, item)
  return [...bySlug.values()]
}

async function resolvePage(component, override) {
  if (override?.title) {
    await sleep(1100)
    const page = await byTitle(override.title)
    const info = page?.imageinfo?.[0]
    if (info && isFreeLicense(info.extmetadata)) return { page, info }
    return null
  }

  for (const query of searchQueries(component)) {
    await sleep(1100)
    const chosen = pick(await search(query), component.name)
    if (chosen) return chosen
  }
  for (const category of categoriesFor(component)) {
    await sleep(1100)
    const chosen = pick(await categoryFiles(category), component.name)
    if (chosen) return chosen
  }
  return null
}

async function main() {
  mkdirSync(outDir, { recursive: true })
  const overrides = loadJson(overridesPath, {})
  const cache = loadJson(cachePath, {})
  const manifest = loadJson(manifestPath, {})
  const components = loadComponents().filter((component) => wanted(component.slug))
  let found = 0
  let missed = 0

  for (const component of components) {
    const override = overrides[component.slug]
    if (override?.skip) {
      missed += 1
      continue
    }
    if (cache[component.slug]?.status === 'hit' && existsSync(resolve(outDir, cache[component.slug].file))) {
      manifest[component.slug] = cache[component.slug].entry
      found += 1
      continue
    }
    if (cache[component.slug]?.status === 'miss' && !override?.title && !retryMisses && !slugFilter?.has(component.slug)) {
      missed += 1
      continue
    }

    try {
      const chosen = await resolvePage(component, override)
      if (!chosen) {
        cache[component.slug] = { status: 'miss' }
        missed += 1
        console.log(`sin foto  ${component.slug}`)
        writeFileSync(cachePath, JSON.stringify(cache, null, 2))
        continue
      }
      const source = chosen.info.thumburl || chosen.info.url
      const ext = source.includes('.png') ? 'png' : source.includes('.webp') ? 'webp' : 'jpg'
      const file = `${component.slug}.${ext}`
      await download(source, resolve(outDir, file))
      const meta = chosen.info.extmetadata ?? {}
      const entry = {
        url: `/images/components/${file}`,
        thumbUrl: `/images/components/${file}`,
        sourcePageUrl: chosen.info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(chosen.page.title)}`,
        author: meta.Artist?.value?.replace(/<[^>]+>/g, '').slice(0, 220) ?? null,
        license: meta.LicenseShortName?.value ?? null,
        width: chosen.info.thumbwidth ?? chosen.info.width ?? null,
        height: chosen.info.thumbheight ?? chosen.info.height ?? null,
        kind: override?.title ? 'manual' : 'photo',
      }
      manifest[component.slug] = entry
      cache[component.slug] = { status: 'hit', file, entry }
      found += 1
      console.log(`foto      ${component.slug} <- ${chosen.page.title}`)
    } catch (error) {
      console.warn(`error     ${component.slug}: ${error instanceof Error ? error.message : error}`)
      missed += 1
    }
    writeFileSync(cachePath, JSON.stringify(cache, null, 2))
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  }

  const entries = Object.values(cache)
  const report = {
    photos: entries.filter((entry) => entry.status === 'hit').length,
    missing: entries.filter((entry) => entry.status === 'miss').length,
    total: entries.length,
    reviewed: components.length,
    passFound: found,
    passMissed: missed,
    retryMisses,
    only: only ? [...only] : null,
  }
  writeFileSync(resolve(root, 'packages/db/seed-data/images-report.json'), JSON.stringify(report, null, 2))
  console.log(`Cobertura: ${found} fotos, ${missed} sin foto, ${components.length} componentes revisados`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
