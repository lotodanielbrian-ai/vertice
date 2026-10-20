import type { CatalogItem } from '@pc/shared'
import { useRef, type MutableRefObject, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, MeshBasicMaterial } from 'three'

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function dimensions(form: string) {
  const massive = form === 'massive' || form === 'dual-gpu'
  const retro = form.includes('retro')
  return {
    length: massive ? 5.4 : retro ? 3.4 : 4.4,
    width: massive ? 2.2 : 1.6,
    retro,
    massive,
    blower: form === 'blower',
    dualGpu: form === 'dual-gpu',
    liquid: form === 'liquid-aio',
  }
}

function Layer({
  baseY,
  offsetY,
  delay,
  progress,
  children,
}: {
  baseY: number
  offsetY: number
  delay: number
  progress: MutableRefObject<number>
  children: ReactNode
}) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const local = Math.min(1, Math.max(0, (progress.current - delay) / (1 - delay)))
    ref.current.position.y = baseY + offsetY * easeInOutCubic(local)
  })
  return <group ref={ref}>{children}</group>
}

function Fan({
  x,
  y,
  radius,
  blades,
  rpm,
  color,
}: {
  x: number
  y: number
  radius: number
  blades: number
  rpm: number
  color: string
}) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!ref.current || rpm <= 0) return
    ref.current.rotation.y += (rpm / 60) * Math.PI * 2 * delta
  })
  return (
    <group ref={ref} position={[x, y, 0]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, 0.08, 24]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} />
      </mesh>
      {Array.from({ length: blades }, (_, index) => {
        const angle = (index / blades) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.cos(angle) * radius * 0.45, 0.03, Math.sin(angle) * radius * 0.45]} rotation={[0.5, angle, 0]}>
            <boxGeometry args={[radius * 0.75, 0.02, 0.1]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
        )
      })}
    </group>
  )
}

export function ProceduralGpu({
  gpu,
  exploded,
  rpm,
  showRgb,
  lod,
}: {
  gpu: CatalogItem
  exploded: boolean
  rpm: number
  showRgb: boolean
  lod: 0 | 1 | 2
}) {
  const progress = useRef(0)
  const led = useRef<Mesh>(null)
  useFrame((_, delta) => {
    const target = exploded ? 1 : 0
    progress.current += (target - progress.current) * Math.min(1, delta * 2.2)
    if (led.current && showRgb && !Array.isArray(led.current.material)) {
      const time = performance.now() / 1000
      const material = led.current.material as MeshBasicMaterial
      material.color.setRGB(
        Math.sin(time * 2) * 0.5 + 0.5,
        Math.sin(time * 2 + 2) * 0.5 + 0.5,
        Math.sin(time * 2 + 4) * 0.5 + 0.5,
      )
    }
  })

  const form = gpu.gpu?.visual.form ?? 'dual'
  const fanCount = gpu.gpu?.visual.fans ?? 0
  const body = gpu.gpu?.visual.color ?? 0x1e293b
  const accent = gpu.gpu?.visual.accentColor ?? 0x22d3ee
  const dims = dimensions(form)
  const finCount = lod === 0 ? 14 : lod === 1 ? 6 : 0
  const bladeCount = form === 'blower' ? (lod === 0 ? 16 : 8) : lod === 0 ? 9 : 5
  const fanRadius = dims.blower ? 0.48 : dims.massive ? 0.62 : 0.5
  const fanXs = dims.blower
    ? [dims.length * 0.28]
    : fanCount >= 3
      ? [-dims.length * 0.28, 0, dims.length * 0.28]
      : fanCount === 2
        ? [-dims.length * 0.22, dims.length * 0.22]
        : fanCount === 1
          ? [0]
          : []
  const pcbColor = gpu.manufacturer === 'ATI' ? 0x991b1b : dims.retro ? 0x15803d : 0x09090b
  const heatsinkColor = dims.retro || gpu.manufacturer === 'ATI' ? 0xd97706 : 0x71717a

  if (lod === 2) {
    return (
      <mesh>
        <boxGeometry args={[dims.length, 0.9, dims.width]} />
        <meshStandardMaterial color={body} metalness={0.4} roughness={0.45} />
      </mesh>
    )
  }

  return (
    <group>
      {!dims.retro && (
        <Layer baseY={-0.55} offsetY={-0.7} delay={0} progress={progress}>
          <mesh>
            <boxGeometry args={[dims.length, 0.06, dims.width]} />
            <meshStandardMaterial color="#18181b" metalness={0.85} roughness={0.25} />
          </mesh>
        </Layer>
      )}
      <Layer baseY={-0.4} offsetY={-0.28} delay={0.08} progress={progress}>
        <group>
          <mesh>
            <boxGeometry args={[dims.length, 0.08, dims.width]} />
            <meshStandardMaterial color={pcbColor} roughness={0.7} />
          </mesh>
          {dims.dualGpu ? (
            <>
              {[-dims.length * 0.22, dims.length * 0.22].map((x) => (
                <mesh key={x} position={[x, 0.07, 0]}>
                  <boxGeometry args={[0.62, 0.06, 0.62]} />
                  <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
                </mesh>
              ))}
              <mesh position={[0, 0.06, 0]}>
                <boxGeometry args={[0.32, 0.04, 0.32]} />
                <meshStandardMaterial color="#d97706" metalness={0.8} />
              </mesh>
            </>
          ) : (
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[0.72, 0.06, 0.72]} />
              <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
            </mesh>
          )}
          <mesh position={[-0.4, 0.02, dims.width / 2 + 0.08]}>
            <boxGeometry args={[1.8, 0.02, 0.16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </Layer>
      <Layer baseY={0.05} offsetY={0.45} delay={0.16} progress={progress}>
        <group>
          {finCount === 0 ? (
            <mesh>
              <boxGeometry args={[dims.length - 0.2, dims.massive ? 0.7 : 0.4, dims.width - 0.15]} />
              <meshStandardMaterial color={heatsinkColor} metalness={0.9} roughness={0.25} />
            </mesh>
          ) : (
            Array.from({ length: finCount }, (_, index) => {
              const span = dims.length - 0.4
              const x = -span / 2 + (span / (finCount - 1)) * index
              return (
                <mesh key={index} position={[x, 0, 0]}>
                  <boxGeometry args={[0.045, dims.massive ? 0.7 : 0.42, dims.width - 0.2]} />
                  <meshStandardMaterial color={heatsinkColor} metalness={0.92} roughness={0.22} />
                </mesh>
              )
            })
          )}
          {lod === 0 &&
            [-0.35, 0.35].map((z) => (
              <mesh key={z} position={[0, 0.05, z]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, dims.length * 0.7, 10]} />
                <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.2} />
              </mesh>
            ))}
        </group>
      </Layer>
      <Layer baseY={0.48} offsetY={0.95} delay={0.28} progress={progress}>
        <group>
          <mesh>
            <boxGeometry args={[dims.length + 0.08, dims.massive ? 0.72 : dims.retro ? 0.28 : 0.46, dims.width + 0.08]} />
            <meshStandardMaterial color={body} metalness={0.5} roughness={0.35} />
          </mesh>
          {showRgb && !dims.retro && gpu.releaseYear >= 2018 && (
            <mesh ref={led} position={[0, (dims.massive ? 0.36 : 0.2), dims.width / 2 + 0.05]}>
              <boxGeometry args={[dims.length - 1, 0.06, 0.04]} />
              <meshBasicMaterial color={accent} />
            </mesh>
          )}
          {fanXs.map((x) => (
            <Fan
              key={x}
              x={x}
              y={(dims.massive ? 0.4 : dims.retro ? 0.16 : 0.26)}
              radius={fanRadius}
              blades={bladeCount}
              rpm={rpm}
              color={dims.blower ? '#7f1d1d' : '#0f172a'}
            />
          ))}
          {dims.liquid && (
            <mesh position={[dims.length * 0.42, 0.1, 0]}>
              <boxGeometry args={[0.35, 0.22, 0.35]} />
              <meshStandardMaterial color="#0369a1" metalness={0.6} roughness={0.3} />
            </mesh>
          )}
        </group>
      </Layer>
    </group>
  )
}
