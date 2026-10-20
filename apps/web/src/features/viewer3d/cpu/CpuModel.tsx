import { brandOf, BRAND_THEME, type CatalogItem } from '@pc/shared'
import { Html, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useLayoutEffect, useRef } from 'react'
import { Object3D, type Group, type InstancedMesh } from 'three'

function packageOf(socket: string): 'pga' | 'lga' | 'bga' {
  if (/bga/i.test(socket)) return 'bga'
  if (/lga|am5/i.test(socket)) return 'lga'
  return 'pga'
}

function shortName(name: string): string {
  return name.replace(/^Intel\s+|^AMD\s+/i, '').trim()
}

export function CpuModel({
  cpu,
  exploded,
  showRgb,
  lod,
  annotations = false,
}: {
  cpu: CatalogItem
  exploded: boolean
  showRgb: boolean
  lod: 0 | 1 | 2
  annotations?: boolean
}) {
  const progress = useRef(0)
  const ihs = useRef<Group>(null)
  const pins = useRef<InstancedMesh>(null)
  const socket = cpu.cpu?.socketName ?? ''
  const pack = packageOf(socket)
  const ultra = /core ultra/i.test(cpu.name)
  const brand = brandOf(cpu)
  const accent = brand ? BRAND_THEME[brand].hex : '#22d3ee'
  const ihsX = ultra ? 1.62 : 1.28
  const ihsZ = ultra ? 1.05 : 1.28
  const grid = lod === 0 ? 16 : 10

  useFrame((_, delta) => {
    const target = exploded ? 1 : 0
    progress.current += (target - progress.current) * Math.min(1, delta * 2.4)
    if (!ihs.current) return
    const t = progress.current
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    ihs.current.position.y = 0.1 + eased * 0.9
  })

  useLayoutEffect(() => {
    const mesh = pins.current
    if (!mesh || pack === 'bga') return
    const dummy = new Object3D()
    const span = 1.2
    let index = 0
    for (let x = 0; x < grid; x += 1) {
      for (let z = 0; z < grid; z += 1) {
        dummy.position.set(
          -span / 2 + (x * span) / (grid - 1),
          pack === 'pga' ? -0.1 : -0.04,
          -span / 2 + (z * span) / (grid - 1),
        )
        dummy.rotation.set(0, 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
        index += 1
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [grid, pack])

  if (lod === 2) {
    return (
      <mesh>
        <boxGeometry args={[1.5, 0.18, 1.5]} />
        <meshStandardMaterial color="#d6d3d1" metalness={0.8} roughness={0.3} />
      </mesh>
    )
  }

  return (
    <group>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.85, 0.08, 1.85]} />
        <meshPhysicalMaterial color={brand === 'Intel' ? '#0c1a33' : '#14532d'} roughness={0.62} metalness={0.12} />
      </mesh>
      {pack !== 'bga' && (
        <instancedMesh ref={pins} count={grid * grid}>
          {pack === 'pga' ? <cylinderGeometry args={[0.012, 0.012, 0.09, 6]} /> : <boxGeometry args={[0.028, 0.012, 0.028]} />}
          <meshStandardMaterial color={pack === 'pga' ? '#a8a29e' : '#eab308'} metalness={0.85} roughness={0.28} />
        </instancedMesh>
      )}
      <mesh position={[0, 0.045, 0.78]}>
        <boxGeometry args={[0.7, 0.02, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={showRgb ? 1.4 : 0.2} />
      </mesh>
      <group ref={ihs}>
        <mesh>
          <boxGeometry args={[ihsX, 0.08, ihsZ]} />
          <meshPhysicalMaterial color="#d6d3d1" metalness={1} roughness={0.22} clearcoat={0.4} />
        </mesh>
        <mesh position={[-ihsX / 2 + 0.08, 0.041, -ihsZ / 2 + 0.08]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.12, 0.01, 0.12]} />
          <meshStandardMaterial color={accent} />
        </mesh>
        {lod === 0 && (
          <Suspense fallback={null}>
            <Text
              position={[0.05, 0.046, 0.02]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={ultra ? 0.09 : 0.1}
              color="#292524"
              anchorX="center"
              anchorY="middle"
              maxWidth={ihsX * 0.82}
            >
              {shortName(cpu.name)}
            </Text>
          </Suspense>
        )}
      </group>
      {annotations && lod === 0 && cpu.cpu && (
        <group>
          <Html position={[0, 1.15, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-white">
              {cpu.cpu.cores} núcleos / {cpu.cpu.threads} hilos
            </span>
          </Html>
          <Html position={[-1.15, 0.3, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-cyan-200">{cpu.cpu.socketName}</span>
          </Html>
          <Html position={[1.15, 0.3, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-amber-200">
              {cpu.cpu.boostClockMhz ? `${cpu.cpu.boostClockMhz} MHz` : 'reloj no catalogado'}
            </span>
          </Html>
        </group>
      )}
    </group>
  )
}
