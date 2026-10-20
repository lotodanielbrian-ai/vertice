import { useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, CatmullRomCurve3, Matrix4, TubeGeometry, Vector3, InstancedMesh } from 'three'
import { useBrushedNormal } from './materials'

export function Heatsink({
  length,
  width,
  fins,
  copper,
}: {
  length: number
  width: number
  fins: number
  copper: boolean
}) {
  const finMesh = useRef<InstancedMesh>(null)
  const normal = useBrushedNormal()
  const finGeometry = useMemo(() => new BoxGeometry(0.018, 0.42, width * 0.72), [width])
  const pipe = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(-length * 0.28, -0.12, width * 0.22),
      new Vector3(-length * 0.05, 0.22, width * 0.22),
      new Vector3(length * 0.22, 0.22, width * 0.22),
      new Vector3(length * 0.34, -0.05, width * 0.22),
    ])
    return new TubeGeometry(curve, 24, 0.045, 10, false)
  }, [length, width])
  useLayoutEffect(() => {
    if (!finMesh.current || fins < 2) return
    const matrix = new Matrix4()
    const span = length * 0.82
    for (let index = 0; index < fins; index += 1) {
      matrix.makeTranslation(-span / 2 + (span / (fins - 1)) * index, 0.08, 0)
      finMesh.current.setMatrixAt(index, matrix)
    }
    finMesh.current.instanceMatrix.needsUpdate = true
  }, [fins, length])
  return (
    <group>
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[length * 0.55, 0.06, width * 0.55]} />
        <meshPhysicalMaterial color={copper ? '#b45309' : '#9a3412'} metalness={0.9} roughness={0.25} />
      </mesh>
      {fins > 1 && (
        <instancedMesh ref={finMesh} args={[finGeometry, undefined, fins]}>
          <meshPhysicalMaterial
            color="#a1a1aa"
            metalness={0.85}
            roughness={0.28}
            normalMap={normal ?? undefined}
          />
        </instancedMesh>
      )}
      {[-width * 0.18, width * 0.18].map((z) => (
        <mesh key={z} geometry={pipe} position={[0, 0, z - width * 0.22]}>
          <meshPhysicalMaterial color="#c2410c" metalness={1} roughness={0.18} />
        </mesh>
      ))}
    </group>
  )
}
