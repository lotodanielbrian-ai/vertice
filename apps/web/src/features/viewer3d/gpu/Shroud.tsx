import { RoundedBox } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, MeshStandardMaterial } from 'three'
import { Fan } from './Fan'
import { useBrushedNormal } from './materials'

export function Shroud({
  length,
  width,
  height,
  color,
  accent,
  showRgb,
  fanXs,
  fanRadius,
  blades,
  rpm,
  blower,
  y,
}: {
  length: number
  width: number
  height: number
  color: number
  accent: number
  showRgb: boolean
  fanXs: number[]
  fanRadius: number
  blades: number
  rpm: number
  blower: boolean
  y: number
}) {
  const led = useRef<Mesh>(null)
  const normal = useBrushedNormal()
  useFrame(() => {
    if (!led.current || !showRgb) return
    const material = led.current.material as MeshStandardMaterial
    const time = performance.now() / 1000
    material.emissive.setRGB(
      Math.sin(time * 2) * 0.5 + 0.5,
      Math.sin(time * 2 + 2) * 0.5 + 0.5,
      Math.sin(time * 2 + 4) * 0.5 + 0.5,
    )
  })
  return (
    <group position={[0, y, 0]}>
      <RoundedBox args={[length, height, width]} radius={0.06} smoothness={3}>
        <meshPhysicalMaterial color={color} metalness={0.55} roughness={0.32} normalMap={normal ?? undefined} clearcoat={0.35} />
      </RoundedBox>
      <mesh position={[0, height / 2 + 0.01, 0]}>
        <boxGeometry args={[length * 0.92, 0.02, width * 0.78]} />
        <meshPhysicalMaterial color="#09090b" metalness={0.2} roughness={0.6} />
      </mesh>
      {showRgb && (
        <mesh ref={led} position={[0, height / 2 - 0.02, width / 2 + 0.01]}>
          <boxGeometry args={[length * 0.72, 0.035, 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}
      {fanXs.map((x) => (
        <Fan key={x} x={x} y={height / 2 + 0.02} radius={fanRadius} blades={blades} rpm={rpm} blower={blower} />
      ))}
    </group>
  )
}
