import type { CatalogItem } from '@pc/shared'
import { Html } from '@react-three/drei'
import { formatBus, formatConnectors } from '../../../lib/format'
import { useRef, type MutableRefObject, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Backplate } from './Backplate'
import { Heatsink } from './Heatsink'
import { Pcb } from './Pcb'
import { Shroud } from './Shroud'
import { gpuPalette } from './materials'

function ease(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function Layer({
  baseY,
  lift,
  delay,
  progress,
  label,
  showLabel,
  children,
}: {
  baseY: number
  lift: number
  delay: number
  progress: MutableRefObject<number>
  label: string
  showLabel: boolean
  children: ReactNode
}) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const local = Math.min(1, Math.max(0, (progress.current - delay) / (1 - delay)))
    ref.current.position.y = baseY + lift * ease(local)
  })
  return (
    <group ref={ref}>
      {children}
      {showLabel && (
        <Html position={[0, 0.35, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <span className="rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-200">{label}</span>
        </Html>
      )}
    </group>
  )
}

export function GpuModel({
  gpu,
  exploded,
  rpm,
  showRgb,
  lod,
  annotations = false,
}: {
  gpu: CatalogItem
  exploded: boolean
  rpm: number
  showRgb: boolean
  lod: 0 | 1 | 2
  annotations?: boolean
}) {
  const progress = useRef(0)
  useFrame((_, delta) => {
    const target = exploded ? 1 : 0
    progress.current += (target - progress.current) * Math.min(1, delta * 2.2)
  })
  const form = gpu.gpu?.visual.form ?? 'dual'
  const massive = form === 'massive' || form === 'dual-gpu'
  const retro = form.includes('retro') || gpu.releaseYear < 2008
  const blower = form === 'blower'
  const length = massive ? 5.6 : retro ? 3.5 : 4.6
  const width = massive ? 2.15 : 1.55
  const palette = gpuPalette({
    manufacturer: gpu.manufacturer,
    releaseYear: gpu.releaseYear,
    color: gpu.gpu?.visual.color ?? 0x18181b,
    accent: gpu.gpu?.visual.accentColor ?? 0x22d3ee,
    form,
  })
  const fanCount = gpu.gpu?.visual.fans ?? (blower ? 1 : retro ? 1 : 2)
  const fanXs = blower
    ? [length * 0.28]
    : fanCount >= 3
      ? [-length * 0.28, 0, length * 0.28]
      : fanCount === 2
        ? [-length * 0.2, length * 0.2]
        : fanCount === 1
          ? [0]
          : []
  const blades = blower ? (lod === 0 ? 18 : 8) : lod === 0 ? 9 : 5
  const fins = lod === 0 ? 64 : lod === 1 ? 28 : 0

  if (lod === 2) {
    return (
      <mesh>
        <boxGeometry args={[length, 0.85, width]} />
        <meshStandardMaterial color={palette.shroud} metalness={0.45} roughness={0.4} />
      </mesh>
    )
  }

  return (
    <group>
      {!retro && (
        <Layer baseY={-0.62} lift={-0.85} delay={0} progress={progress} label="Backplate" showLabel={exploded}>
          <Backplate length={length} width={width} />
        </Layer>
      )}
      <Layer baseY={-0.38} lift={-0.28} delay={0.08} progress={progress} label="PCB" showLabel={exploded}>
        <Pcb gpu={gpu} length={length} width={width} pcbColor={palette.pcb} dualGpu={form === 'dual-gpu'} />
      </Layer>
      <Layer baseY={0.02} lift={0.55} delay={0.16} progress={progress} label="Disipador" showLabel={exploded}>
        <Heatsink length={length} width={width} fins={fins} copper={retro || palette.ati} />
      </Layer>
      <Layer baseY={0.46} lift={1.05} delay={0.28} progress={progress} label="Shroud" showLabel={exploded}>
        <Shroud
          length={length + 0.08}
          width={width + 0.06}
          height={massive ? 0.62 : retro ? 0.28 : 0.42}
          color={palette.shroud}
          accent={palette.accent}
          showRgb={showRgb && !retro && gpu.releaseYear >= 2016}
          fanXs={fanXs}
          fanRadius={blower ? 0.42 : massive ? 0.52 : 0.44}
          blades={blades}
          rpm={rpm}
          blower={blower}
          y={0}
        />
      </Layer>
      {annotations && lod === 0 && gpu.gpu && (
        <group>
          <Html position={[0, 1.35, 0.2]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-white">
              {gpu.gpu.vramMb != null ? `${Math.round(gpu.gpu.vramMb / 1024)} GB ${gpu.gpu.vramType ?? ''}` : 'VRAM no catalogada'}
            </span>
          </Html>
          <Html position={[length * 0.15, 0.15, -width * 0.85]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-amber-200">
              {formatConnectors(gpu.gpu.powerConnectors)}
            </span>
          </Html>
          <Html position={[length * 0.62, 0.15, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-cyan-200">
              {formatBus(gpu.gpu.busInterface)}{gpu.gpu.busLanes ? ` x${gpu.gpu.busLanes}` : ''}
            </span>
          </Html>
        </group>
      )}
    </group>
  )
}
