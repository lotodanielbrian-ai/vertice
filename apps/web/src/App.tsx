import { analyzeBuild, rankCatalog, resolveBuild } from '@pc/engine'
import { useQuery } from '@tanstack/react-query'
import { Award, Box, CircuitBoard, RotateCw, Scale, Sparkles } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { PartSearch } from './components/PartSearch'
import { ComparePage } from './features/compare/ComparePage'
import { TierListPage } from './features/tierlist/TierListPage'
import { fetchCatalog, fetchPlatforms } from './lib/api'
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
  const analysis = useMemo(() => {
    if (!catalog.data) return null
    return analyzeBuild(resolveBuild(selection, catalog.data), catalog.data, {
      socketChipsets: platforms.data?.socketChipsets ?? [],
    })
  }, [catalog.data, platforms.data, selection])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-2">
              <Box className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="argb-text text-xl font-black uppercase tracking-tight">Vértice</h1>
              <p className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                Showroom · ensamble · compatibilidad · 3D
              </p>
            </div>
          </div>
          {catalog.data && <PartSearch items={catalog.data} />}
          <button type="button" onClick={() => setRankingOpen(true)} className="hidden rounded-full border border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase text-slate-200 sm:inline">
            Lista de GPUs
          </button>
          <nav aria-label="Secciones" className="flex max-w-[62vw] gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 p-1.5">
            {TABS.map((item) => {
              const Icon = ICONS[item.id]
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setTab(item.id as TabId)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black sm:text-xs ${active ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'text-slate-400'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
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
    </div>
  )
}
