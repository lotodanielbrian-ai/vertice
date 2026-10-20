import { BRAND_THEME, brandOf, type CatalogItem } from '@pc/shared'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { YourGpuPill } from '../../components/YourGpuPill'
import { useInstalledGpu } from '../../lib/localGpu'
import { useNavStore } from '../../nav'

type Resolution = 'p1080' | 'p1440' | 'p2160'
type Mode = 'raster' | 'rt'

function fpsOf(item: CatalogItem, mode: Mode, resolution: Resolution): number | null {
  return item.benchmarks?.[mode][resolution] ?? null
}

export function RankingPanel({
  items,
  currentSlug,
  onClose,
}: {
  items: CatalogItem[]
  currentSlug: string | null
  onClose: () => void
}) {
  const openPart = useNavStore((state) => state.openPart)
  const installedGpu = useInstalledGpu(items)
  const installed = installedGpu
    ? { renderer: installedGpu.renderer, slug: installedGpu.item?.slug ?? null, name: installedGpu.item?.name ?? null }
    : null
  const [resolution, setResolution] = useState<Resolution>('p1440')
  const [mode, setMode] = useState<Mode>('raster')
  const [brand, setBrand] = useState<'all' | 'nvidia' | 'amd' | 'intel'>('all')
  const [order, setOrder] = useState<'perf' | 'new' | 'old'>('perf')

  const rows = useMemo(() => {
    const list = items.filter((item) => item.type === 'gpu' && (brand === 'all' || brandOf(item)?.toLowerCase() === brand))
    const measured = list.filter((item) => fpsOf(item, mode, resolution) != null)
    const missing = list.filter((item) => fpsOf(item, mode, resolution) == null)
    measured.sort((a, b) => {
      if (order === 'new') return b.releaseYear - a.releaseYear
      if (order === 'old') return a.releaseYear - b.releaseYear
      return (fpsOf(b, mode, resolution) ?? 0) - (fpsOf(a, mode, resolution) ?? 0)
    })
    return [...measured, ...missing]
  }, [brand, items, mode, order, resolution])

  const installedItem = items.find((item) => item.slug === installed?.slug)
  const installedFps = installedItem ? fpsOf(installedItem, mode, resolution) : null
  const topMeasured = rows.find((item) => fpsOf(item, mode, resolution) != null)
  const baseline = installedFps ?? fpsOf(topMeasured ?? rows[0], mode, resolution) ?? 1
  const usingLocal = installedFps != null
  const percents = rows.map((item) => {
    const fps = fpsOf(item, mode, resolution)
    return fps == null ? null : Math.round((fps / baseline) * 100)
  })
  const maxPercent = Math.max(100, ...percents.filter((value): value is number => value != null))
  const listRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    if (!installed?.slug) return
    listRef.current?.querySelector(`[data-slug="${installed.slug}"]`)?.scrollIntoView({ block: 'center' })
  }, [installed?.slug, rows])
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const buttons = [...(listRef.current?.querySelectorAll('button') ?? [])]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'ArrowDown' ? Math.min(buttons.length - 1, index + 1) : Math.max(0, index - 1)
    event.preventDefault()
    buttons[next]?.focus()
  }

  const group = (label: string, currentValue: string, options: [string, string][]) => (
    <fieldset className="flex flex-wrap gap-1">
      <legend className="sr-only">{label}</legend>
      {options.map(([id, text]) => (
        <label key={id} className={`cursor-pointer rounded-full px-2 py-1 text-[10px] font-black uppercase ${currentValue === id ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
          <input type="radio" className="sr-only" name={label} checked={currentValue === id} onChange={() => {
            if (label === 'resolución') setResolution(id as Resolution)
            if (label === 'modo') setMode(id as Mode)
            if (label === 'marca') setBrand(id as typeof brand)
            if (label === 'orden') setOrder(id as typeof order)
          }} />
          {text}
        </label>
      ))}
    </fieldset>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 p-4" onClick={onClose} role="presentation">
      <div role="dialog" aria-label="Ranking de GPUs" tabIndex={-1} onKeyDown={onKeyDown} className="mt-16 max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 custom-scrollbar" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black uppercase text-white">Rendimiento</h2>
          <button type="button" onClick={onClose} className="text-xs font-black text-slate-400">Cerrar</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {group('resolución', resolution, [['p1080', '1080p'], ['p1440', '1440p'], ['p2160', '4K']])}
          {group('modo', mode, [['raster', 'Raster'], ['rt', 'Ray tracing']])}
          {group('marca', brand, [['all', 'Todas'], ['nvidia', 'NVIDIA'], ['amd', 'AMD'], ['intel', 'Intel']])}
          {group('orden', order, [['perf', 'Rendimiento'], ['new', 'Más recientes'], ['old', 'Más antiguas']])}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          {installed == null
            ? 'Leyendo la placa de esta PC…'
            : usingLocal
              ? `El 100% es la placa de esta PC: ${installed.name}. El navegador informa «${installed.renderer}».`
              : installed.renderer
                ? `No se pudo ubicar «${installed.renderer}» en el catálogo. El 100% vuelve a la placa más alta medida.`
                : 'El navegador no informó la placa de esta PC. El 100% vuelve a la placa más alta medida.'}
        </p>
        <ul ref={listRef} className="mt-4 space-y-1">
          {rows.map((item, index) => {
            const fps = fpsOf(item, mode, resolution)
            const percent = percents[index]
            const brandName = brandOf(item)
            const hex = brandName ? BRAND_THEME[brandName].hex : '#94a3b8'
            const yours = installed?.slug === item.slug
            const opened = item.slug === currentSlug && !yours
            return (
              <li key={item.slug} data-slug={item.slug}>
                <button type="button" onClick={() => { openPart(item.slug, 'gpu'); onClose() }} className={`grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-2 text-left text-xs ${fps == null ? 'text-slate-600' : 'hover:bg-slate-900'} ${opened ? 'ring-1 ring-slate-600' : ''}`} style={yours ? { boxShadow: `0 0 0 2px ${hex}` } : undefined}>
                  <span className="font-black text-slate-500">{fps == null ? '—' : index + 1}</span>
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-bold" style={{ color: fps == null ? undefined : hex }}>
                      {item.name}
                      {yours && <YourGpuPill hex={hex} />}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.gpu?.architecture} · {item.releaseYear}</span>
                    {percent != null && (
                      <span className="mt-1 block h-1 rounded bg-slate-800">
                        <span className="block h-full rounded" style={{ width: `${(percent / maxPercent) * 100}%`, background: hex }} />
                      </span>
                    )}
                  </span>
                  <span className="text-right">
                    <span className="block font-black text-white">{percent != null ? `${percent}%` : 'sin medición'}</span>
                    <span className="text-[10px] text-slate-500">{fps != null ? `${fps.toFixed(0)} FPS` : ''} · {item.gpu?.vramMb != null && item.gpu.vramMb > 0 ? (item.gpu.vramMb >= 1024 ? `${Math.round(item.gpu.vramMb / 1024)} GB` : `${item.gpu.vramMb} MB`) : ''} · {item.tdpWatts} W · {item.priceUsd != null ? `$${item.priceUsd}` : ''}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
