import { rankGaming, similarParts } from '@pc/engine'
import { BRAND_THEME, brandOf, type CatalogItem, type Tier } from '@pc/shared'
import { Suspense, lazy, useMemo, useState } from 'react'
import { BrandLogo } from '../../components/BrandLogo'
import { BenchmarkSources } from '../../components/BenchmarkSources'
import { ComponentImage } from '../../components/ComponentImage'
import { seriesLogo } from '../../lib/brands'
import { formatBus, formatConnectors, tierClass } from '../../lib/format'
import { gpuTechnologies, splitModelName } from '../../lib/technologies'
import { useNavStore } from '../../nav'
import { BUILDER_STEPS, useBuildStore } from '../../store'

const StageCanvas = lazy(() => import('../showroom/StageCanvas').then((module) => ({ default: module.StageCanvas })))

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function SpecLine({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 border-t border-white/10 py-2 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-semibold text-white">{value}</dd>
    </div>
  )
}

export function PartPage({
  items,
  ranks,
  slug,
}: {
  items: CatalogItem[]
  ranks: Map<string, Tier>
  slug: string
}) {
  const [webgl] = useState(canUseWebGL)
  const openPart = useNavStore((state) => state.openPart)
  const openViewer = useNavStore((state) => state.openViewer)
  const openCompare = useNavStore((state) => state.openCompare)
  const setTab = useNavStore((state) => state.setTab)
  const assign = useBuildStore((state) => state.assign)
  const setStep = useBuildStore((state) => state.setStep)
  const item = items.find((entry) => entry.slug === slug)
  const family = item?.type === 'cpu' ? 'cpu' : 'gpu'
  const ranking = useMemo(() => rankGaming(items, family), [family, items])
  const ranked = ranking.parts.find((part) => part.item.slug === slug) ?? null
  const near = useMemo(() => similarParts(ranking.parts, slug), [ranking.parts, slug])
  if (!item) return <p className="text-slate-400">Esa pieza no está en el catálogo.</p>

  const brand = brandOf(item)
  const theme = brand ? BRAND_THEME[brand] : { hex: '#22d3ee', glow: 'rgba(34,211,238,0.35)', ink: '#052e16' }
  const logo = seriesLogo(item.type, brand)
  const title = splitModelName(item)
  const eraTier = ranks.get(item.slug) ?? item.baseTier
  const awards = ranking.awards.filter((award) => award.item.slug === item.slug)
  const measured1440 = item.benchmarks?.raster.p1440 != null
  const maxFps = Math.max(
    1,
    ...items.map((entry) => entry.benchmarks?.raster.p1080 ?? 0),
    ...items.map((entry) => entry.benchmarks?.rt.p1080 ?? 0),
  )
  const gpu = item.gpu
  const specs: [string, string | null][] = gpu
    ? [
        ['GPU', gpu.architecture],
        ['Bus de memoria', gpu.memoryBusWidthBits != null ? `${gpu.memoryBusWidthBits} bits` : null],
        ['Ancho de banda', gpu.memoryBandwidthGbps != null ? `${gpu.memoryBandwidthGbps} GB/s` : null],
        ['Litografía', gpu.lithographyNm != null ? `${gpu.lithographyNm} nm` : null],
        ['TMUs / ROPs', gpu.tmus != null && gpu.rops != null ? `${gpu.tmus} / ${gpu.rops}` : null],
        ['Conectores', gpu.powerConnectors ? formatConnectors(gpu.powerConnectors) : null],
        ['Fuente recomendada', gpu.recommendedPsuWatts != null ? `${gpu.recommendedPsuWatts} W o más` : null],
        ['Largo', gpu.lengthMm != null ? `${gpu.lengthMm} mm` : null],
        ['Alto', gpu.heightMm != null ? `${gpu.heightMm} mm` : null],
        ['Slots', gpu.slotWidth != null ? String(gpu.slotWidth) : null],
        ['PCIe', gpu.busInterface ? `${formatBus(gpu.busInterface)}${gpu.busLanes ? ` x${gpu.busLanes}` : ''}` : null],
        ['Lanzamiento', String(item.releaseYear)],
      ]
    : item.cpu
      ? [
          ['Socket', item.cpu.socketName],
          ['Arquitectura', item.cpu.architecture],
          ['Litografía', item.cpu.lithographyNm != null ? `${item.cpu.lithographyNm} nm` : null],
          ['Núcleos P / E', `${item.cpu.performanceCores} / ${item.cpu.efficiencyCores}`],
          ['Reloj base', item.cpu.baseClockMhz != null ? `${item.cpu.baseClockMhz} MHz` : null],
          ['Caché L2', item.cpu.l2CacheKb > 0 ? `${item.cpu.l2CacheKb} KB` : null],
          ['RAM máxima', item.cpu.maxRamGen.toUpperCase()],
          ['Gráficos integrados', item.cpu.integratedGraphics],
          ['Instrucciones', item.cpu.instructionSets.length > 0 ? item.cpu.instructionSets.join(', ') : null],
          ['Lanzamiento', String(item.releaseYear)],
        ]
      : []

  const add = () => {
    if (item.type !== 'gpu' && item.type !== 'cpu') return
    assign(item.type, item.slug)
    setStep(Math.max(BUILDER_STEPS.indexOf(item.type), 0))
    setTab('builder')
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black px-4 py-8 sm:px-8" style={{ background: `radial-gradient(700px 280px at 50% 18%, ${theme.glow}, transparent 70%), #020202` }}>
      <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center overflow-hidden" aria-hidden>
        <span className="select-none text-[18rem] font-black leading-none text-white/5">{title.model}</span>
      </div>
      <div className="relative mx-auto max-w-5xl text-center">
        {logo && <BrandLogo src={logo} alt={brand ?? item.manufacturer} className="mx-auto mb-4 h-12 w-32" />}
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">{title.kicker}</p>
        <p className="mt-3 text-2xl font-black uppercase tracking-wide text-white">{title.series}</p>
        <h2 className="bg-gradient-to-b from-white to-slate-500 bg-clip-text text-[clamp(4.5rem,16vw,10rem)] font-black leading-none text-transparent">{title.model}</h2>
        <div className="mx-auto mt-2 h-72 max-w-xl" aria-label="Modelo 3D. Arrastrá para girarlo">
          {webgl ? (
            <Suspense fallback={<ComponentImage item={item} priority className="h-full w-full" />}>
              <StageCanvas item={item} interactive accent={theme.hex} />
            </Suspense>
          ) : (
            <ComponentImage item={item} priority className="h-full w-full" />
          )}
        </div>
      </div>

      <section className="relative mx-auto mt-4 max-w-5xl rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur">
        <h3 className="text-center text-2xl font-black uppercase tracking-wide text-white">Especificaciones oficiales</h3>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(item.gpu
            ? [
                [item.gpu.shaderCores != null ? item.gpu.shaderCores.toLocaleString('es-AR') : null, 'Shaders'],
                [item.gpu.boostClockMhz != null ? `${item.gpu.boostClockMhz}` : null, 'MHz boost'],
                [item.gpu.vramMb != null && item.gpu.vramMb > 0 ? `${item.gpu.vramMb >= 1024 ? `${Math.round(item.gpu.vramMb / 1024)} GB` : `${item.gpu.vramMb} MB`} ${item.gpu.vramType ?? ''}`.trim() : null, 'Memoria'],
                [`${item.tdpWatts}`, 'W TDP'],
              ]
            : item.cpu
              ? [
                  [`${item.cpu.cores}/${item.cpu.threads}`, 'Núcleos / hilos'],
                  [item.cpu.boostClockMhz != null ? `${item.cpu.boostClockMhz}` : null, 'MHz boost'],
                  [item.cpu.l3CacheKb >= 1024 ? `${Math.round(item.cpu.l3CacheKb / 1024)} MB` : `${item.cpu.l3CacheKb} KB`, 'Caché L3'],
                  [`${item.tdpWatts}`, 'W TDP'],
                ]
              : []
          ).filter((row): row is [string, string] => Boolean(row[0])).map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Chip y memoria</h4>
            <dl>{specs.slice(0, Math.ceil(specs.length / 2)).map(([label, value]) => <SpecLine key={label} label={label} value={value} />)}</dl>
            {item.gpu && (
              <>
                <h4 className="mt-6 text-[11px] font-black uppercase tracking-widest text-slate-500">Tecnologías</h4>
                <dl>
                  {gpuTechnologies(item).map((row) => <SpecLine key={row.label} label={row.label} value={row.value} />)}
                </dl>
              </>
            )}
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.gpu ? 'Tarjeta' : 'Procesador'}</h4>
            <dl>{specs.slice(Math.ceil(specs.length / 2)).map(([label, value]) => <SpecLine key={label} label={label} value={value} />)}</dl>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {ranked && <span className={`rounded border px-2 py-1 text-[11px] font-black ${tierClass(ranked.tier)}`}>2026 {ranked.tier}</span>}
          <span className={`rounded border px-2 py-1 text-[11px] font-black ${tierClass(eraTier)}`}>época {eraTier}</span>
          {awards.map((award) => <span key={award.id} className="rounded border border-amber-400/40 px-2 py-1 text-[11px] font-black text-amber-200">{award.label}</span>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => openViewer(item.slug)} className="rounded-xl border border-cyan-400 px-3 py-2 text-xs font-black uppercase text-cyan-200">Ver en 3D</button>
          <button type="button" onClick={() => openCompare(item.slug, near[0]?.part.item.slug ?? null)} className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-black uppercase text-slate-200">Comparar</button>
          <button type="button" onClick={add} className="rounded-xl px-3 py-2 text-xs font-black uppercase" style={{ background: theme.hex, color: theme.ink }}>Al ensamble</button>
        </div>
      </section>

      {item.type === 'gpu' && (
        <section className="mx-auto mt-8 max-w-5xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Rendimiento promedio (FPS)</h3>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {(['raster', 'rt'] as const).map((mode) => (
              <div key={mode}>
                <p className="text-xs font-black uppercase text-slate-300">{mode === 'raster' ? 'Raster' : 'Ray tracing'}</p>
                {(['p1080', 'p1440', 'p2160'] as const).map((key) => {
                  const fps = item.benchmarks?.[mode][key]
                  const label = key === 'p1080' ? '1080p' : key === 'p1440' ? '1440p' : '4K'
                  return (
                    <div key={key} className="mt-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{label}</span>
                        <span className="font-black text-white">{fps != null ? `${fps.toFixed(1)} FPS` : 'sin medición'}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-800">
                        <div className="h-full rounded" style={{ width: `${fps != null ? Math.min(100, (fps / maxFps) * 100) : 0}%`, background: theme.hex }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {item.type === 'gpu' && <div className="mt-4"><BenchmarkSources source={item.benchmarks?.source} /></div>}
        </section>
      )}

      <section className="mx-auto mt-10 max-w-5xl">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-2xl font-black uppercase text-white">{family === 'gpu' ? 'GPUs similares' : 'CPUs similares'}</h3>
          <p className="text-[11px] uppercase tracking-widest text-slate-500">{family === 'gpu' && measured1440 ? 'Rendimiento parecido en 1440p raster' : 'Índice gaming parecido'}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {near.map(({ part, deltaPercent }) => (
            <button key={part.item.slug} type="button" onClick={() => openPart(part.item.slug, family)} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-left">
              <p className="text-sm font-black uppercase text-white">{splitModelName(part.item).series}</p>
              <p className="text-2xl font-black text-white">{splitModelName(part.item).model}</p>
              <p className="mt-2 text-xs text-slate-400">{deltaPercent === 0 ? 'Mismo nivel' : deltaPercent < 0 ? `${Math.abs(deltaPercent)} % más lenta` : `${deltaPercent} % más rápida`}{family === 'gpu' && measured1440 ? ' en 1440p' : ''}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-3xl text-xs leading-relaxed text-slate-500">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Metodología y fuentes</h3>
        <p className="mt-2">Si una pieza no tiene fila, se muestra «sin medición»: no se inventan números. El índice 2026 usa esos FPS cuando existen y, si no, el índice del catálogo con penalizaciones por VRAM, arquitectura y doble GPU. Las fotos vienen de Wikimedia Commons, con autor y licencia.</p>
      </section>
    </div>
  )
}
