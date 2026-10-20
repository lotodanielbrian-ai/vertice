import type { CatalogItem } from '@pc/shared'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import { ACESFilmicToneMapping, type Group } from 'three'
import { CpuModel } from '../viewer3d/cpu/CpuModel'
import { GpuModel } from '../viewer3d/gpu/GpuModel'

function Spin({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.35
  })
  return <group ref={ref}>{children}</group>
}

export function StageCanvas({
  item,
  interactive = false,
  accent = '#76b900',
}: {
  item: CatalogItem
  interactive?: boolean
  accent?: string
}) {
  return (
    <Canvas
      camera={{ position: [3.4, 1.7, 4.4], fov: 34 }}
      dpr={[1, 1.5]}
      gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, antialias: true }}
    >
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} />
      <Environment frames={1} resolution={128}>
        <Lightformer intensity={2} position={[0, 3, 2]} scale={[6, 3, 1]} color="#e2e8f0" />
        <Lightformer intensity={1} position={[-3, 1, -2]} scale={[3, 2, 1]} color="#22d3ee" />
      </Environment>
      {interactive ? (
        <group>
          {item.type === 'cpu' ? (
            <group scale={1.7}>
              <CpuModel cpu={item} exploded={false} showRgb lod={1} />
            </group>
          ) : (
            <GpuModel gpu={item} exploded={false} rpm={900} showRgb lod={1} />
          )}
        </group>
      ) : (
        <Spin>
          {item.type === 'cpu' ? (
            <group scale={1.7}>
              <CpuModel cpu={item} exploded={false} showRgb lod={1} />
            </group>
          ) : (
            <GpuModel gpu={item} exploded={false} rpm={900} showRgb lod={1} />
          )}
        </Spin>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshBasicMaterial color={accent} transparent opacity={0.28} />
      </mesh>
      <ContactShadows position={[0, -1.15, 0]} opacity={0.4} scale={8} blur={2.2} far={3} />
      {interactive && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />}
    </Canvas>
  )
}
