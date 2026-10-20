import type { Analysis } from '@pc/engine'
import type { CatalogItem } from '@pc/shared'
import { CameraControls, ContactShadows, Detailed, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, SMAA } from '@react-three/postprocessing'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { ComponentImage } from '../../components/ComponentImage'
import { useNavStore } from '../../nav'
import { CpuModel } from './cpu/CpuModel'
import { ExternalMesh } from './ExternalMesh'
import { GpuModel } from './gpu/GpuModel'

const VIEWS = [
  { id: 'frente', label: 'Frente', position: [0, 1.1, 6.2] as const },
  { id: 'dorso', label: 'Dorso', position: [0, 1.2, -6.2] as const },
  { id: 'arriba', label: 'Arriba', position: [0.4, 7.2, 0.2] as const },
  { id: 'conectores', label: 'Conectores', position: [6.4, 0.5, 0.3] as const },
  { id: 'despiece', label: 'Despiece', position: [2.4, 3.4, 5.6] as const },
]

export function ViewerPage({ items, analysis }: { items: CatalogItem[]; analysis: Analysis }) {
  const viewerSlug = useNavStore((state) => state.viewerSlug)
  const setViewerSlug = useNavStore((state) => state.setViewerSlug)
  const pool = useMemo(
    () => items.filter((item) => item.type === 'gpu' || item.type === 'cpu').sort((a, b) => b.releaseYear - a.releaseYear),
    [items],
  )
  const fallback = pool.find((item) => item.slug === 'g_5090') ?? pool.find((item) => item.type === 'gpu') ?? pool[0]
  const [slug, setSlug] = useState(viewerSlug ?? fallback?.slug ?? '')
  const [kind, setKind] = useState<'gpu' | 'cpu'>(pool.find((item) => item.slug === (viewerSlug ?? fallback?.slug))?.type === 'cpu' ? 'cpu' : 'gpu')
  const [query, setQuery] = useState('')
  const [exploded, setExploded] = useState(false)
  const [spinning, setSpinning] = useState(true)
  const [showRgb, setShowRgb] = useState(true)
  const [annotations, setAnnotations] = useState(false)
  const [useGlb, setUseGlb] = useState(false)
  const [live, setLive] = useState(true)
  const [quality, setQuality] = useState<'high' | 'low'>('high')
  const camera = useRef<CameraControls>(null)
  const item = pool.find((entry) => entry.slug === slug) ?? pool.find((entry) => entry.type === kind) ?? fallback

  useEffect(() => {
    if (!viewerSlug) return
    const chosen = pool.find((entry) => entry.slug === viewerSlug)
    if (!chosen) return
    setSlug(chosen.slug)
    if (chosen.type === 'gpu' || chosen.type === 'cpu') setKind(chosen.type)
  }, [pool, viewerSlug])

  useEffect(() => {
    setLive(true)
    if (spinning || showRgb || exploded) return
    const timer = window.setTimeout(() => setLive(false), 900)
    return () => window.clearTimeout(timer)
  }, [exploded, showRgb, slug, spinning])

  const visible = pool.filter((entry) => entry.type === kind).filter((entry) => {
    if (!query) return true
    return entry.name.toLowerCase().includes(query.toLowerCase()) || String(entry.releaseYear).includes(query)
  })

  if (!item) return <p className="text-slate-400">No hay piezas en el catálogo.</p>
  const external = item.type === 'gpu' ? item.assets3d?.find((asset) => asset.url.startsWith('/') || asset.url.startsWith('http')) : undefined
  const fanRpm = item.type === 'gpu' && spinning ? (analysis.thermal.maxRpm > 0 ? analysis.thermal.fanRpm : 1400) : 0

  const choose = (next: string) => {
    setSlug(next)
    setViewerSlug(next)
    setUseGlb(false)
  }

  const go = (view: (typeof VIEWS)[number]) => {
    const [x, y, z] = view.position
    void camera.current?.setLookAt(x, y, z, 0, 0, 0, true)
    if (view.id === 'despiece') setExploded(true)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="glass-panel max-h-[760px] space-y-2 overflow-y-auto rounded-2xl p-3 custom-scrollbar">
        <div className="flex gap-1 rounded-lg bg-slate-900 p-1" role="tablist" aria-label="Tipo de pieza">
          {(['gpu', 'cpu'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={kind === value}
              onClick={() => setKind(value)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-black uppercase ${kind === value ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
            >
              {value}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs outline-none focus:border-cyan-400"
        />
        {visible.map((entry) => (
          <button
            key={entry.slug}
            type="button"
            onClick={() => choose(entry.slug)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${entry.slug === item.slug ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <ComponentImage item={entry} className="h-10 w-14 shrink-0" />
            <span>
              <span className="block font-bold">{entry.name}</span>
              <span className="text-[10px] text-slate-500">{entry.releaseYear} · {entry.type === 'gpu' ? entry.gpu?.visual.form : entry.cpu?.socketName}</span>
            </span>
          </button>
        ))}
        {visible.length === 0 && <p className="px-2 text-xs text-slate-500">Ninguna pieza coincide.</p>}
      </aside>
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950">
        <div className="absolute left-4 top-4 z-10 flex max-w-xs flex-col gap-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Motor 3D</p>
            <h3 className="text-sm font-black text-white">{item.name}</h3>
            <p className="text-[11px] text-slate-400">
              {item.releaseYear} · {item.type === 'gpu' ? item.gpu?.architecture : item.cpu?.architecture}
              {item.type === 'gpu' ? ` · ${fanRpm.toFixed(0)} RPM` : ''}
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-xs font-bold">
            <button type="button" onClick={() => setExploded((value) => !value)} className={`rounded-lg border px-3 py-2 ${exploded ? 'border-cyan-400 text-cyan-200' : 'border-slate-700 text-slate-300'}`}>Despiece {exploded ? 'ON' : 'OFF'}</button>
            {item.type === 'gpu' && (
              <button type="button" onClick={() => setSpinning((value) => !value)} className={`rounded-lg border px-3 py-2 ${spinning ? 'border-emerald-400 text-emerald-200' : 'border-slate-700 text-slate-300'}`}>Ventiladores {spinning ? 'ON' : 'OFF'}</button>
            )}
            <button type="button" onClick={() => setShowRgb((value) => !value)} className={`rounded-lg border px-3 py-2 ${showRgb ? 'border-fuchsia-400 text-fuchsia-200' : 'border-slate-700 text-slate-300'}`}>ARGB {showRgb ? 'ON' : 'OFF'}</button>
            <button type="button" onClick={() => setAnnotations((value) => !value)} className={`rounded-lg border px-3 py-2 ${annotations ? 'border-amber-400 text-amber-200' : 'border-slate-700 text-slate-300'}`}>Anotaciones {annotations ? 'ON' : 'OFF'}</button>
            {external && (
              <button type="button" onClick={() => setUseGlb((value) => !value)} className={`rounded-lg border px-3 py-2 ${useGlb ? 'border-amber-400 text-amber-200' : 'border-slate-700 text-slate-300'}`}>GLB Draco {useGlb ? 'ON' : 'OFF'}</button>
            )}
            <div className="flex flex-wrap gap-1">
              {VIEWS.map((view) => (
                <button key={view.id} type="button" onClick={() => go(view)} className="rounded border border-slate-700 px-2 py-1 text-[10px] uppercase text-slate-300">{view.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-[640px] w-full">
          <Canvas
            shadows
            frameloop={live ? 'always' : 'demand'}
            camera={{ position: [4.2, 2.2, 5.4], fov: 38 }}
            dpr={quality === 'high' ? [1, 1.75] : 1}
            gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
            style={{ width: '100%', height: '100%' }}
          >
            <color attach="background" args={['#020617']} />
            <PerformanceMonitor onDecline={() => setQuality('low')} onIncline={() => setQuality('high')} />
            <ambientLight intensity={0.35} />
            <directionalLight position={[4, 7, 3]} intensity={1.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
            <Environment frames={1} resolution={256}>
              <Lightformer intensity={2.2} position={[0, 4, 2]} scale={[8, 4, 1]} color="#dbeafe" />
              <Lightformer intensity={1.2} position={[-4, 1, -2]} scale={[4, 2, 1]} color="#22d3ee" />
              <Lightformer intensity={0.8} position={[4, 0, -3]} scale={[3, 3, 1]} color="#f43f5e" />
            </Environment>
            {useGlb && external ? (
              <ExternalMesh url={external.url} />
            ) : item.type === 'cpu' ? (
              <group scale={1.75}>
                <CpuModel cpu={item} exploded={exploded} showRgb={showRgb && quality === 'high'} lod={quality === 'low' ? 1 : 0} annotations={annotations} />
              </group>
            ) : quality === 'low' ? (
              <GpuModel gpu={item} exploded={exploded} rpm={fanRpm} showRgb={false} lod={1} annotations={false} />
            ) : (
              <Detailed distances={[0, 5.5, 8.5]}>
                <GpuModel gpu={item} exploded={exploded} rpm={fanRpm} showRgb={showRgb} lod={0} annotations={annotations} />
                <GpuModel gpu={item} exploded={exploded} rpm={fanRpm} showRgb={showRgb} lod={1} />
                <GpuModel gpu={item} exploded={exploded} rpm={0} showRgb={false} lod={2} />
              </Detailed>
            )}
            <ContactShadows position={[0, -1.15, 0]} opacity={0.45} scale={12} blur={2.4} far={4} />
            {quality === 'high' && (
              <EffectComposer multisampling={0}>
                <N8AO aoRadius={0.4} intensity={1.1} distanceFalloff={0.6} />
                <Bloom luminanceThreshold={1} mipmapBlur intensity={0.6} />
                <SMAA />
              </EffectComposer>
            )}
            <CameraControls ref={camera} minDistance={2.2} maxDistance={12} minPolarAngle={0.2} maxPolarAngle={Math.PI / 1.7} />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
