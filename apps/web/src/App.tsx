import { analyzeBuild, rankCatalog, resolveBuild } from '@pc/engine'
import { BRAND_THEME, brandOf } from '@pc/shared'
import { useQuery } from '@tanstack/react-query'
import { Award, Box, CircuitBoard, RotateCw, Scale, Sparkles } from 'lucide-react'
import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import { PartSearch } from './components/PartSearch'
import { ComparePage } from './features/compare/ComparePage'
import { TierListPage } from './features/tierlist/TierListPage'
import { fetchCatalog, fetchPlatforms } from './lib/api'
import { shortGpuLabel, shortRenderer, useInstalledGpu } from './lib/localGpu'
import { TABS, useNavStore, type TabId } from './nav'
import { useBuildStore } from './store'

const ShowroomPage = lazy(() => import('./features/showroom/ShowroomPage').then((module) => ({ default: module.ShowroomPage })))
const ViewerPage = lazy(() => import('./features/viewer3d/ViewerPage').then((module) => ({ default: module.ViewerPage })))
const BuilderPage = lazy(() => import('./features/builder/BuilderPage').then((module) => ({ default: module.BuilderPage })))
const PartPage = lazy(() => import('./features/part/PartPage').then((module) => ({ default: module.PartPage })))
const RankingPanel = lazy(() => import('./features/part/RankingPanel').then((module) => ({ default: module.RankingPanel })))

const ICONS = {
  showroom: Sparkles,
  builder: CircuitBoard,
  tierlist: Award,
  '3d': RotateCw,
  compare: Scale,
} as const

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando catálogo">
      <div className="h-72 animate-pulse rounded-3xl bg-slate-800/80" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-48 animate-pulse rounded-2xl bg-slate-800/70" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-800/60" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-800/50" />
      </div>
    </div>
  )
}

export function App() {
  const tab = useNavStore((state) => state.tab)
  const setTab = useNavStore((state) => state.setTab)
  const selection = useBuildStore((state) => state.selection)
  const partSlug = useNavStore((state) => state.partSlug)
  const [rankingOpen, setRankingOpen] = useState(false)
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: fetchCatalog })
  const platforms = useQuery({ queryKey: ['platforms'], queryFn: fetchPlatforms })

  const ranks = useMemo(() => rankCatalog(catalog.data ?? []), [catalog.data])
  const installed = useInstalledGpu(catalog.data ?? [])
  const installedBrand = installed?.item ? brandOf(installed.item) : null
  const installedHex = installedBrand ? BRAND_THEME[installedBrand].hex : '#94a3b8'
  const analysis = useMemo(() => {
    if (!catalog.data) return null
    return analyzeBuild(resolveBuild(selection, catalog.data), catalog.data, {
      socketChipsets: platforms.data?.socketChipsets ?? [],
    })
  }, [catalog.data, platforms.data, selection])

  const assetBase = import.meta.env.BASE_URL
  return (
    <div
      className="relative min-h-screen w-full min-w-0 text-slate-100"
      style={{
        '--bg-mobile': `url("${assetBase}brand/batalla.png")`,
        '--bg-tablet': `url("${assetBase}brand/epica.png")`,
        '--bg-desktop': `url("${assetBase}brand/epica-2.png")`,
      } as CSSProperties}
    >
      <div className="site-backdrop" aria-hidden="true" />
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-800">
        <div className="flex w-full min-w-0 items-center gap-3 px-4 py-2">
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-2">
              <Box className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="argb-text whitespace-nowrap text-[1.05rem] font-black uppercase leading-none tracking-tight sm:text-[1.2rem]">
                PC Gamers Argentina
              </h1>
              <p className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                Showroom · ensamble · compatibilidad · 3D
              </p>
            </div>
          </div>
          {catalog.data && <PartSearch items={catalog.data} />}
          {installed?.ready && installed.item && (
            <span
              className="hidden min-w-0 max-w-[14rem] shrink truncate rounded-full border px-3 py-1.5 text-[10px] font-black uppercase text-slate-100 md:inline-block"
              style={{ borderColor: installedHex, color: installedHex }}
              title={installed.item.name}
            >
              Tu placa · {shortGpuLabel(installed.item)}
            </span>
          )}
          {installed?.ready && !installed.item && installed.renderer && (
            <span className="hidden min-w-0 max-w-[16rem] shrink truncate rounded-full border border-slate-600 px-3 py-1.5 text-[10px] font-bold text-slate-400 md:inline-block" title={installed.renderer}>
              Sin ficha · {shortRenderer(installed.renderer)}
            </span>
          )}
          <button type="button" onClick={() => setRankingOpen(true)} className="hidden shrink-0 rounded-full border border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase text-slate-200 sm:inline">
            Lista de GPUs
          </button>
          <nav aria-label="Secciones" className="flex min-w-0 shrink gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 p-1.5">
            {TABS.map((item) => {
              const Icon = ICONS[item.id]
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setTab(item.id as TabId)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black sm:text-xs ${active ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'text-slate-400'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="relative z-10 w-full min-w-0 px-4 py-8">
        {catalog.isLoading && <PageSkeleton />}
        {catalog.isError && (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            No hay conexión con la API en el puerto 3001. Levantá PostgreSQL, las migraciones y `pnpm dev:api`.
          </p>
        )}
        {catalog.data && analysis && (
          <Suspense fallback={<PageSkeleton />}>
            {tab === 'showroom' && <ShowroomPage items={catalog.data} ranks={ranks} />}
            {tab === 'builder' && (
              <BuilderPage
                items={catalog.data}
                ranks={ranks}
                analysis={analysis}
                context={{ socketChipsets: platforms.data?.socketChipsets ?? [] }}
              />
            )}
            {tab === 'tierlist' && <TierListPage items={catalog.data} ranks={ranks} />}
            {tab === 'compare' && <ComparePage items={catalog.data} ranks={ranks} />}
            {tab === '3d' && <ViewerPage items={catalog.data} analysis={analysis} />}
            {tab === 'part' && partSlug && <PartPage items={catalog.data} ranks={ranks} slug={partSlug} />}
          </Suspense>
        )}
        {rankingOpen && catalog.data && (
          <Suspense fallback={null}>
            <RankingPanel items={catalog.data} currentSlug={partSlug} onClose={() => setRankingOpen(false)} />
          </Suspense>
        )}
      </main>
      <footer className="relative z-10 w-full min-w-0 px-4 pb-10 text-[11px] leading-relaxed text-slate-500">
        <p>
          Inspiración de la vitrina y del ranking:{' '}
          <a className="underline" href="https://www.michaelpcmaster.com/" target="_blank" rel="noreferrer">Michael Quesada</a>.
        </p>
        <p className="mt-1">
          Precios y tiendas:{' '}
          <a className="underline" href="https://www.hardgamers.com.ar/" target="_blank" rel="noreferrer">HardGamers</a>,
          que reúne los avisos. «Ver en …» abre la tienda.
        </p>
        <p className="mt-1">
          Rendimiento: TechPowerUp, ComputerBase y Tom's Hardware. Los FPS son una escala de esas reseñas, no la medición de un juego.
        </p>
        <p className="mt-1">Fotos de catálogo: Wikimedia Commons, con autor y licencia en cada ficha.</p>
      </footer>
    </div>
  )
}
