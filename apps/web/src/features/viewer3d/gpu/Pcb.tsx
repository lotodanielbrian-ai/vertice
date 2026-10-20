import type { CatalogItem } from '@pc/shared'

function connectorKind(gpu: CatalogItem): 'molex' | '8pin' | 'hpwr' | 'none' {
  const connectors = gpu.gpu?.powerConnectors
  if (connectors) {
    if ((connectors.hpwr_16pin ?? 0) > 0 || (connectors['12v_2x6'] ?? 0) > 0) return 'hpwr'
    if ((connectors.pcie_8pin ?? 0) > 0 || (connectors.pcie_6pin ?? 0) > 0) return '8pin'
    if ((connectors.molex_4pin ?? 0) > 0) return 'molex'
  }
  if (gpu.releaseYear < 2006) return 'molex'
  if (gpu.releaseYear >= 2022 && gpu.tdpWatts >= 300) return 'hpwr'
  if (gpu.tdpWatts >= 75) return '8pin'
  return 'none'
}

export function Pcb({
  gpu,
  length,
  width,
  pcbColor,
  dualGpu,
}: {
  gpu: CatalogItem
  length: number
  width: number
  pcbColor: number
  dualGpu: boolean
}) {
  const chips = Math.min(12, Math.max(4, Math.round((gpu.gpu?.memoryBusWidthBits ?? 128) / 32)))
  const power = connectorKind(gpu)
  const retroIo = gpu.releaseYear < 2008
  return (
    <group>
      <mesh>
        <boxGeometry args={[length, 0.06, width]} />
        <meshPhysicalMaterial color={pcbColor} roughness={0.55} metalness={0.15} clearcoat={0.25} clearcoatRoughness={0.6} />
      </mesh>
      {(dualGpu ? [-length * 0.18, length * 0.18] : [0]).map((x) => (
        <mesh key={x} position={[x, 0.05, 0]}>
          <boxGeometry args={[0.62, 0.04, 0.62]} />
          <meshPhysicalMaterial color="#d6d3d1" metalness={1} roughness={0.15} />
        </mesh>
      ))}
      {Array.from({ length: chips }, (_, index) => {
        const side = index % 2 === 0 ? 1 : -1
        const along = (index - chips / 2) * 0.16
        return (
          <mesh key={index} position={[along, 0.045, side * 0.48]}>
            <boxGeometry args={[0.12, 0.03, 0.16]} />
            <meshPhysicalMaterial color="#111827" metalness={0.6} roughness={0.3} />
          </mesh>
        )
      })}
      {Array.from({ length: 6 }, (_, index) => (
        <mesh key={`vrm-${index}`} position={[-length * 0.36, 0.05, -width * 0.28 + index * 0.1]}>
          <cylinderGeometry args={[0.035, 0.035, 0.05, 10]} />
          <meshPhysicalMaterial color="#27272a" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[-0.2, -0.01, width / 2 + 0.06]}>
        <boxGeometry args={[1.7, 0.015, 0.12]} />
        <meshPhysicalMaterial color="#ca8a04" metalness={1} roughness={0.2} />
      </mesh>
      <group position={[length / 2 + 0.04, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.06, 0.7, width * 0.85]} />
          <meshPhysicalMaterial color="#71717a" metalness={0.8} roughness={0.35} />
        </mesh>
        {(retroIo ? [0.18, 0, -0.18] : [0.16, -0.02, -0.18]).map((z, index) => (
          <mesh key={z} position={[0.04, retroIo ? 0.08 : 0.12, z]}>
            <boxGeometry args={[0.04, retroIo && index === 0 ? 0.16 : 0.08, retroIo && index === 0 ? 0.28 : 0.14]} />
            <meshPhysicalMaterial color="#18181b" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
      {power !== 'none' && (
        <group position={[length * 0.18, 0.06, -width / 2 - 0.06]}>
          <mesh>
            <boxGeometry args={[power === 'hpwr' ? 0.55 : power === 'molex' ? 0.28 : 0.7, 0.08, 0.1]} />
            <meshPhysicalMaterial color="#18181b" roughness={0.5} metalness={0.2} />
          </mesh>
          {power === '8pin' &&
            [ -0.22, 0.22].map((x) => (
              <mesh key={x} position={[x, 0.05, 0]}>
                <boxGeometry args={[0.22, 0.03, 0.08]} />
                <meshPhysicalMaterial color="#eab308" metalness={0.9} roughness={0.25} />
              </mesh>
            ))}
        </group>
      )}
    </group>
  )
}
