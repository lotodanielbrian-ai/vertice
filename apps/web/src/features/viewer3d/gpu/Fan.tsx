import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ExtrudeGeometry, Matrix4, Shape, InstancedMesh } from 'three'

function useBlade(radius: number, blower: boolean) {
  return useMemo(() => {
    const shape = new Shape()
    if (blower) {
      shape.moveTo(0.05, 0.015)
      shape.lineTo(radius * 0.92, 0.05)
      shape.lineTo(radius * 0.92, -0.05)
      shape.lineTo(0.05, -0.015)
    } else {
      shape.moveTo(0.06, 0.02)
      shape.bezierCurveTo(radius * 0.35, 0.14, radius * 0.72, 0.16, radius * 0.96, 0.015)
      shape.bezierCurveTo(radius * 0.78, -0.03, radius * 0.36, -0.02, 0.06, -0.025)
    }
    shape.closePath()
    const geometry = new ExtrudeGeometry(shape, {
      depth: blower ? 0.012 : 0.018,
      bevelEnabled: !blower,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 1,
    })
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [blower, radius])
}

export function Fan({
  x,
  y,
  radius,
  blades,
  rpm,
  blower,
}: {
  x: number
  y: number
  radius: number
  blades: number
  rpm: number
  blower: boolean
}) {
  const spin = useRef<InstancedMesh>(null)
  const geometry = useBlade(radius, blower)
  useLayoutEffect(() => {
    if (!spin.current) return
    const matrix = new Matrix4()
    for (let index = 0; index < blades; index += 1) {
      matrix.makeRotationY((index / blades) * Math.PI * 2)
      spin.current.setMatrixAt(index, matrix)
    }
    spin.current.instanceMatrix.needsUpdate = true
  }, [blades])
  useFrame((_, delta) => {
    if (!spin.current || rpm <= 0) return
    spin.current.rotation.y += (rpm / 60) * Math.PI * 2 * delta
  })
  return (
    <group position={[x, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.98, 0.035, 8, 32]} />
        <meshPhysicalMaterial color="#0b0f14" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radius * 0.22, radius * 0.22, 0.05, 20]} />
        <meshPhysicalMaterial color="#111827" metalness={0.7} roughness={0.25} />
      </mesh>
      <instancedMesh ref={spin} args={[geometry, undefined, blades]}>
        <meshPhysicalMaterial color={blower ? '#3f1d1d' : '#1f2937'} metalness={0.25} roughness={0.4} />
      </instancedMesh>
    </group>
  )
}
