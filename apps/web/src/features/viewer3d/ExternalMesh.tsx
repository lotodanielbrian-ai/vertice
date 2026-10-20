import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import type { Group } from 'three'

const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
const BASIS_PATH = 'https://unpkg.com/three@0.170.0/examples/jsm/libs/basis/'

export function ExternalMesh({ url }: { url: string }) {
  const gl = useThree((state) => state.gl)
  const [scene, setScene] = useState<Group | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loader = new GLTFLoader()
    const draco = new DRACOLoader()
    draco.setDecoderPath(DRACO_PATH)
    loader.setDRACOLoader(draco)
    const ktx2 = new KTX2Loader()
    ktx2.setTranscoderPath(BASIS_PATH)
    ktx2.detectSupport(gl)
    loader.setKTX2Loader(ktx2)
    let alive = true
    loader.load(
      url,
      (gltf) => {
        if (alive) setScene(gltf.scene)
      },
      undefined,
      () => {
        if (alive) setError('No se pudo decodificar el GLB')
      },
    )
    return () => {
      alive = false
      draco.dispose()
      ktx2.dispose()
    }
  }, [gl, url])

  if (error) return null
  if (!scene) return null
  return <primitive object={scene} />
}
