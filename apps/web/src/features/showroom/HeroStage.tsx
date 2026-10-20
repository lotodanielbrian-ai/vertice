import { BRAND_THEME, type CatalogItem, type Tier } from '@pc/shared'
import { Suspense, lazy, useState } from 'react'
import { BrandLogo } from '../../components/BrandLogo'
import { ComponentImage } from '../../components/ComponentImage'
import { seriesLogo } from '../../lib/brands'
import { tierClass } from '../../lib/format'
import type { BrandId, FamilyId } from '../../nav'
import { BrandTabs } from './BrandTabs'

const StageCanvas = lazy(() => import('./StageCanvas').then((module) => ({ default: module.StageCanvas })))

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const THEME_KEY = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel' } as const

export function HeroStage({
  item,
  tier,
  family,
  brand,
  onFamily,
  onBrand,
  onBuild,
  onView,
}: {
  item: CatalogItem | undefined
  tier: Tier | undefined
  family: FamilyId
  brand: BrandId
  onFamily: (family: FamilyId) => void
  onBrand: (brand: BrandId) => void
  onBuild: () => void
  onView: () => void
}) {
  const [webgl] = useState(canUseWebGL)
  const theme = BRAND_THEME[THEME_KEY[brand]]
  const logo = seriesLogo(family, brand)
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10"
      style={{
        background: `radial-gradient(900px 420px at 78% 18%, ${theme.glow}, transparent 60%), linear-gradient(160deg, #020617 10%, #0b1220 70%)`,
      }}
    >
      <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative z-10 space-y-5">
          <div className="flex items-center gap-3">
            {logo && <BrandLogo src={logo} alt={brand} className="h-14 w-36" />}
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">PC Gamers Argentina</p>
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl">Showroom</h2>
            <p className="mt-3 max-w-md text-sm text-slate-300">
              GPUs y CPUs de NVIDIA, AMD e Intel, con foto real cuando existe y el modelo 3D para girarlas antes de armar la PC.
            </p>
          </div>
          <BrandTabs family={family} brand={brand} onFamily={onFamily} onBrand={onBrand} />
          {item ? (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.hex }}>Pieza tope de la marca</p>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white">{item.name}</h3>
                {tier && <span className={`rounded border px-1.5 py-0.5 text-[10px] font-black ${tierClass(tier)}`}>{tier}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onBuild} className="rounded-xl px-4 py-2 text-xs font-black uppercase" style={{ background: theme.hex, color: theme.ink }}>
                  Armar mi PC
                </button>
                <button type="button" onClick={onView} className="rounded-xl border border-white/20 px-4 py-2 text-xs font-black uppercase text-white">
                  Ver en 3D
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No hay piezas de esta marca en el catálogo.</p>
          )}
        </div>
        <div className="relative h-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 lg:h-[420px]">
          {item && webgl ? (
            <Suspense fallback={<ComponentImage item={item} priority className="h-full w-full" />}>
              <StageCanvas key={item.slug} item={item} />
            </Suspense>
          ) : item ? (
            <ComponentImage item={item} priority className="h-full w-full" />
          ) : null}
        </div>
      </div>
    </section>
  )
}
