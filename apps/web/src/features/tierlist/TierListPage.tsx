import { GAMING_TIER_LABEL, rankGaming, type Award } from '@pc/engine'
import { TIERS, BRAND_THEME, brandOf, type CatalogItem, type ComponentType, type Tier } from '@pc/shared'
import { useMemo, useState } from 'react'
import { BrandLogo } from '../../components/BrandLogo'
import { YourGpuPill } from '../../components/YourGpuPill'
import { ComponentImage } from '../../components/ComponentImage'
import { markLogo } from '../../lib/brands'
import { useInstalledGpu } from '../../lib/localGpu'
import { useNavStore } from '../../nav'

const TYPES: ComponentType[] = ['gpu', 'cpu', 'motherboard', 'ram', 'psu', 'cooler', 'storage', 'case']
const TIER_BAND: Record<Tier, string> = {
  'S+': '#a855f7',
  S: '#3b82f6',
  A: '#22c55e',
  B: '#eab308',
  C: '#f97316',
  D: '#ef4444',
  E: '#64748b',
  F: '#334155',
}

function BrandLegend() {
  return (
    <ul className="flex flex-wrap gap-3 text-[10px] font-black uppercase">
      {(['NVIDIA', 'AMD', 'Intel'] as const).map((brand) => (
        <li key={brand} className="flex items-center gap-1.5" style={{ color: BRAND_THEME[brand].hex }}>
          <span className="h-2 w-2 rounded-full" style={{ background: BRAND_THEME[brand].hex }} />
          {brand}
        </li>
      ))}
    </ul>
  )
}

function Awards({ awards }: { awards: Award[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {awards.map((award) => (
        <li key={award.id} className="rounded-xl border border-amber-400/30 bg-slate-950/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">{award.label}</p>
          <p className="mt-1 text-sm font-bold text-white">{award.item.name}</p>
        </li>
      ))}
    </ul>
  )
}

export function TierListPage({ items, ranks }: { items: CatalogItem[]; ranks: Map<string, Tier> }) {
  const [mode, setMode] = useState<'2026' | 'era'>('2026')
  const [type, setType] = useState<ComponentType>('gpu')
  const [family, setFamily] = useState<'gpu' | 'cpu'>('gpu')
  const [era, setEra] = useState('all')
  const openPart = useNavStore((state) => state.openPart)
  const installed = useInstalledGpu(items)
  const yours = installed?.item?.slug ?? null
  const ranking = useMemo(() => rankGaming(items, family), [family, items])

  const filtered = items.filter((item) => item.type === type).filter((item) => {
    if (era === 'all') return true
    const [from, to] = era.split('-').map(Number)
    return item.releaseYear >= from && item.releaseYear <= to
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode('2026')} className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${mode === '2026' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
          Ranking 2026
        </button>
        <button type="button" onClick={() => setMode('era')} className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${mode === 'era' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
          Por época
        </button>
      </div>
      {mode === '2026' ? (
        <>
          <div className="flex gap-2">
            {(['gpu', 'cpu'] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFamily(value)} className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${family === value ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {value}
              </button>
            ))}
          </div>
          <BrandLegend />
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const row = ranking.parts.filter((part) => part.tier === tier)
              return (
                <section key={tier} className="glass-panel overflow-hidden rounded-2xl">
                  <div className="flex items-center gap-3 px-4 py-3" style={{ background: TIER_BAND[tier] }}>
                    <h3 className="text-2xl font-black text-slate-950">{tier}</h3>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-950/80">{GAMING_TIER_LABEL[tier]}</p>
                  </div>
                  {row.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-600">Sin piezas en este tier.</p>
                  ) : (
                    <ul className="flex min-w-0 gap-2 overflow-x-auto p-3 custom-scrollbar">
                      {row.map((part) => {
                        const logo = markLogo(brandOf(part.item))
                        const brand = brandOf(part.item)
                        const hex = brand ? BRAND_THEME[brand].hex : '#334155'
                        const yoursCard = part.item.slug === yours
                        return (
                          <li key={part.item.slug} className="shrink-0">
                            <button type="button" onClick={() => openPart(part.item.slug, family)} className="w-44 rounded-xl border-2 bg-slate-950/70 p-2 text-left" style={yoursCard ? { borderColor: hex, boxShadow: `0 0 0 2px #020617, 0 0 0 4px ${hex}` } : { borderColor: hex }}>
                              <span className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black text-slate-400">#{part.position}</span>
                                {yoursCard ? <YourGpuPill hex={hex} /> : logo && <BrandLogo src={logo} alt={part.item.manufacturer} className="h-5 w-8" />}
                              </span>
                              <ComponentImage item={part.item} className="mt-1 h-16 w-full" />
                              <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-snug" style={{ color: hex }}>{part.item.name}</p>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
          <Awards awards={ranking.awards} />
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((value) => (
              <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase ${type === value ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {value}
              </button>
            ))}
            <select value={era} onChange={(event) => setEra(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs" aria-label="Época">
              <option value="all">Todas las épocas</option>
              <option value="2000-2006">2000-2006</option>
              <option value="2007-2014">2007-2014</option>
              <option value="2015-2018">2015-2018</option>
              <option value="2019-2026">2019-2026</option>
            </select>
          </div>
          <BrandLegend />
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const row = filtered.filter((item) => (ranks.get(item.slug) ?? item.baseTier) === tier)
              return (
                <section key={tier} className="glass-panel flex gap-3 rounded-2xl p-3">
                  <h3 className="flex w-12 shrink-0 items-center justify-center text-lg font-black text-cyan-300">{tier}</h3>
                  {row.length === 0 ? (
                    <p className="self-center text-xs text-slate-600">Sin piezas en este tier.</p>
                  ) : (
                    <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {row.map((item) => {
                        const brand = brandOf(item)
                        const hex = brand ? BRAND_THEME[brand].hex : '#334155'
                        const yoursCard = item.slug === yours
                        return (
                          <li key={item.slug} className="w-44 shrink-0 rounded-xl border-2 bg-slate-950/70 p-2" style={yoursCard ? { borderColor: hex, boxShadow: `0 0 0 2px #020617, 0 0 0 4px ${hex}` } : { borderColor: hex }}>
                            {yoursCard && <YourGpuPill hex={hex} />}
                            <ComponentImage item={item} className="h-24 w-full" />
                            <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-snug" style={{ color: hex }}>{item.name}</p>
                            <p className="text-[10px] text-slate-500">{item.releaseYear} · base {item.baseTier}</p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
