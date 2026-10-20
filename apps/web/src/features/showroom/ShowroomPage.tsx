import { rankGaming, type Award } from '@pc/engine'
import { BRAND_THEME, brandOf, isConceptual, type CatalogItem, type Tier } from '@pc/shared'
import { useMemo, useState } from 'react'
import { BrandLogo } from '../../components/BrandLogo'
import { ComponentImage } from '../../components/ComponentImage'
import { seriesLogo } from '../../lib/brands'
import { specHighlights, tierClass } from '../../lib/format'
import { useNavStore, type BrandId, type FamilyId } from '../../nav'
import { BUILDER_STEPS, useBuildStore } from '../../store'
import { HeroStage } from './HeroStage'
import { ProductCarousel } from './ProductCarousel'

const THEME_KEY = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel' } as const
const ERAS = [
  { id: 'all', label: 'Todas las épocas' },
  { id: '2000-2006', label: '2000-2006' },
  { id: '2007-2014', label: '2007-2014' },
  { id: '2015-2018', label: '2015-2018' },
  { id: '2019-2026', label: '2019-2026' },
]

function isShowcasePart(item: CatalogItem) {
  if (isConceptual(item)) return false
  return !/instinct|supercluster|vera rubin|data center|mi300|b200/i.test(`${item.slug} ${item.name}`)
}

function inEra(year: number, era: string) {
  if (era === 'all') return true
  const [from, to] = era.split('-').map(Number)
  return year >= from && year <= to
}

function Awards({ awards }: { awards: Award[] }) {
  if (awards.length === 0) return null
  return (
    <ul className="flex min-w-0 gap-2 overflow-x-auto pb-1 custom-scrollbar">
      {awards.map((award) => (
        <li key={award.id} className="min-w-44 shrink-0 rounded-xl border border-amber-400/30 bg-slate-950/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">{award.label}</p>
          <p className="mt-1 text-xs font-bold text-white">{award.item.name}</p>
        </li>
      ))}
    </ul>
  )
}

export function ShowroomPage({ items, ranks }: { items: CatalogItem[]; ranks: Map<string, Tier> }) {
  const family = useNavStore((state) => state.family)
  const brand = useNavStore((state) => state.brand)
  const setShowroom = useNavStore((state) => state.setShowroom)
  const openPart = useNavStore((state) => state.openPart)
  const openViewer = useNavStore((state) => state.openViewer)
  const setTab = useNavStore((state) => state.setTab)
  const assign = useBuildStore((state) => state.assign)
  const setStep = useBuildStore((state) => state.setStep)
  const [era, setEra] = useState('all')
  const [sort, setSort] = useState<'score' | 'year' | 'price'>('score')

  const pool = useMemo(
    () => items.filter((item) => item.type === family && brandOf(item)?.toLowerCase() === brand),
    [brand, family, items],
  )
  const ranking = useMemo(() => rankGaming(items, family), [family, items])
  const rankTiers = useMemo(() => new Map(ranking.parts.map((part) => [part.item.slug, part.tier])), [ranking.parts])
  const featured = useMemo(
    () => pool.filter(isShowcasePart).sort((a, b) => (rankTiers.has(b.slug) ? ranking.parts.find((part) => part.item.slug === b.slug)!.index : b.performanceScore) - (rankTiers.has(a.slug) ? ranking.parts.find((part) => part.item.slug === a.slug)!.index : a.performanceScore)).slice(0, 8),
    [pool, rankTiers, ranking.parts],
  )
  const hero = featured[0] ?? pool[0]
  const topBrand = ranking.parts.filter((part) => brandOf(part.item)?.toLowerCase() === brand).slice(0, 3)
  const grid = useMemo(() => {
    const rows = pool.filter((item) => inEra(item.releaseYear, era))
    rows.sort((a, b) => {
      if (sort === 'year') return b.releaseYear - a.releaseYear
      if (sort === 'price') return (b.priceUsd ?? 0) - (a.priceUsd ?? 0)
      return (ranking.parts.find((part) => part.item.slug === b.slug)?.index ?? b.performanceScore) - (ranking.parts.find((part) => part.item.slug === a.slug)?.index ?? a.performanceScore)
    })
    return rows
  }, [era, pool, ranking.parts, sort])

  const logo = seriesLogo(family, brand)

  const addToBuild = (item: CatalogItem) => {
    if (item.type !== 'gpu' && item.type !== 'cpu') return
    assign(item.type, item.slug)
    setStep(Math.max(BUILDER_STEPS.indexOf(item.type), 0))
    setTab('builder')
  }

  const themeKey = THEME_KEY[brand]

  return (
    <div
      className="space-y-8"
      style={{ ['--brand' as string]: BRAND_THEME[themeKey].hex, ['--brand-glow' as string]: BRAND_THEME[themeKey].glow, ['--brand-ink' as string]: BRAND_THEME[themeKey].ink }}
    >
      <HeroStage
        item={hero}
        tier={hero ? rankTiers.get(hero.slug) ?? ranks.get(hero.slug) ?? hero.baseTier : undefined}
        family={family}
        brand={brand}
        onFamily={(next: FamilyId) => setShowroom(next, brand)}
        onBrand={(next: BrandId) => setShowroom(family, next)}
        onBuild={() => hero && addToBuild(hero)}
        onView={() => hero && openViewer(hero.slug)}
      />
      <ProductCarousel
        key={`${family}-${brand}`}
        items={featured}
        ranks={ranks}
        rankTiers={rankTiers}
        onSelect={(item) => openPart(item.slug, family)}
      />
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white">Ranking 2026</h3>
            <p className="text-xs text-slate-500">Rendimiento en juegos hoy, entre todas las marcas.</p>
          </div>
          <button type="button" onClick={() => setTab('tierlist')} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-black text-cyan-200">
            Ver ranking completo
          </button>
        </div>
        <Awards awards={ranking.awards} />
        <div className="grid gap-3 md:grid-cols-3">
          {topBrand.map((part) => (
            <button key={part.item.slug} type="button" onClick={() => openPart(part.item.slug, family)} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand)' }}>#{part.position} · {part.tier}</p>
              <p className="mt-1 text-sm font-bold text-white">{part.item.name}</p>
              <p className="text-[11px] text-slate-500">índice {part.index.toFixed(0)}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            {logo && <BrandLogo src={logo} alt={themeKey} className="h-10 w-24" />}
            <div>
              <h3 className="text-lg font-black text-white">Catálogo {themeKey}</h3>
              <p className="text-xs text-slate-500">{grid.length} piezas en esta vista</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={era} onChange={(event) => setEra(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs" aria-label="Época">
              {ERAS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as 'score' | 'year' | 'price')} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs" aria-label="Orden">
              <option value="score">Índice 2026</option>
              <option value="year">Año</option>
              <option value="price">Precio</option>
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {grid.map((item) => {
            const eraTier = ranks.get(item.slug) ?? item.baseTier
            const rankTier = rankTiers.get(item.slug)
            return (
              <button key={item.slug} type="button" onClick={() => openPart(item.slug, family)} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 text-left hover:border-[var(--brand)]">
                <ComponentImage item={item} className="h-32 w-full" />
                <span className="block space-y-1 p-3">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-white">{item.name}</span>
                    <span className="flex flex-col items-end gap-1">
                      {rankTier && <span className={`rounded border px-1.5 py-0.5 text-[10px] font-black ${tierClass(rankTier)}`} title="Ranking 2026">2026 {rankTier}</span>}
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-black ${tierClass(eraTier)}`} title="Tier por época">{eraTier}</span>
                    </span>
                  </span>
                  <span className="block text-[11px] text-slate-500">{specHighlights(item).join(' · ')}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
