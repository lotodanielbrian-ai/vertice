import { RoundedBox } from '@react-three/drei'
import { useBrushedNormal } from './materials'

export function Backplate({ length, width }: { length: number; width: number }) {
  const normal = useBrushedNormal()
  return (
    <group>
      <RoundedBox args={[length * 0.96, 0.045, width * 0.92]} radius={0.03} smoothness={2}>
        <meshPhysicalMaterial color="#18181b" metalness={0.9} roughness={0.28} normalMap={normal ?? undefined} />
      </RoundedBox>
      {[-0.35, 0, 0.35].map((x) => (
        <mesh key={x} position={[x * length * 0.4, 0.03, 0]}>
          <boxGeometry args={[0.35, 0.01, width * 0.35]} />
          <meshPhysicalMaterial color="#09090b" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
      {[-length * 0.4, length * 0.4].map((x) => (
        <mesh key={x} position={[x, 0.03, width * 0.28]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
          <meshPhysicalMaterial color="#a1a1aa" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
