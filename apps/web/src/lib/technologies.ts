import type { CatalogItem } from '@pc/shared'

export interface TechRow {
  label: string
  value: string
}

function generation(item: CatalogItem): string {
  const arch = item.gpu?.architecture.toLowerCase() ?? ''
  const name = item.name.toLowerCase()
  if (/blackwell|gb20/.test(arch) || /\brtx\s*50/.test(name)) return 'blackwell'
  if (/ada|ad10/.test(arch) || /\brtx\s*40/.test(name)) return 'ada'
  if (/ampere|ga10/.test(arch) || /\brtx\s*30/.test(name)) return 'ampere'
  if (/turing|tu10/.test(arch) || /\brtx\s*20/.test(name)) return 'turing'
  if (/rdna\s*4|navi\s*4/.test(arch) || /\brx\s*90/.test(name)) return 'rdna4'
  if (/rdna\s*3|navi\s*3/.test(arch) || /\brx\s*7/.test(name)) return 'rdna3'
  if (/rdna\s*2|navi\s*2/.test(arch) || /\brx\s*6/.test(name)) return 'rdna2'
  if (/battlemage|xe2/.test(arch) || /\barc\s+b/.test(name)) return 'arc-b'
  if (/alchemist|xe-hpg/.test(arch) || /\barc\s+a/.test(name)) return 'arc-a'
  return 'legacy'
}

export function gpuTechnologies(item: CatalogItem): TechRow[] {
  const gen = generation(item)
  const rt = gen !== 'legacy'
  const rows: TechRow[] = [
    { label: 'Ray tracing por hardware', value: rt && gen !== 'legacy' ? 'Sí' : 'No' },
  ]
  const upscaling: Record<string, string> = {
    blackwell: 'DLSS 4',
    ada: 'DLSS 3',
    ampere: 'DLSS 2',
    turing: 'DLSS 2',
    rdna4: 'FSR 4',
    rdna3: 'FSR 3',
    rdna2: 'FSR 2',
    'arc-b': 'XeSS 2',
    'arc-a': 'XeSS 1',
  }
  const frames: Record<string, string> = {
    blackwell: 'DLSS, hasta 4×',
    ada: 'DLSS 3',
    rdna4: 'FSR 3',
    rdna3: 'FSR 3',
    'arc-b': 'XeSS',
  }
  if (upscaling[gen]) rows.push({ label: 'Reescalado', value: upscaling[gen] })
  if (frames[gen]) rows.push({ label: 'Generación de cuadros', value: frames[gen] })
  const av1 = ['blackwell', 'ada', 'rdna4', 'rdna3', 'arc-b', 'arc-a'].includes(gen)
  rows.push({ label: 'Codificación AV1', value: av1 ? 'Sí' : 'No' })
  return rows
}

function architectureLine(item: CatalogItem): string {
  const arch = item.gpu?.architecture ?? item.cpu?.architecture ?? ''
  const paren = arch.match(/^(.*?)\s*\(([^)]+)\)/)
  const die = /\b[A-Z]{2,4}-[A-Z]?\d{2,4}[A-Z]?|\b[A-Z]{2,4}\d{2,4}[A-Z]?|\bNavi\s*\d{2}\b/i
  let family = arch
  let chip: string | null = null
  if (paren) {
    const head = paren[1].replace(/\bfull\b/i, '').trim()
    const inside = paren[2].trim()
    const headDie = head.match(die)?.[0] ?? null
    const insideDie = inside.match(die)?.[0] ?? null
    if (headDie && !insideDie) {
      chip = headDie
      family = inside
    } else if (insideDie && !headDie) {
      chip = insideDie
      family = head
    } else {
      family = inside
      chip = head
    }
  } else {
    chip = arch.match(die)?.[0] ?? null
    family = chip ? arch.replace(chip, '').replace(/[()/]/g, ' ').replace(/\s+/g, ' ').trim() : arch
  }
  return [family, chip && chip.toLowerCase() !== family.toLowerCase() ? chip : null, String(item.releaseYear)]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase()
}

export function splitModelName(item: CatalogItem): { kicker: string; series: string; model: string } {
  const kicker = architectureLine(item)
  const bare = item.name
    .replace(/^NVIDIA\s+|^AMD\s+|^Intel\s+/i, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(GB|MB)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  const match = bare.match(/^(.*?)\s+((?=[A-Za-z]*\d)[A-Za-z]?\d[\w+.-]*(?:\s+(?:SUPER|Ti|XTX|XT|GRE|LE))*)$/i)
  if (!match?.[1]) return { kicker, series: bare.toUpperCase(), model: '' }
  return { kicker, series: match[1].toUpperCase(), model: match[2].toUpperCase() }
}
