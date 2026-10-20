import type { Workload } from './domain'

export interface BenchmarkProfile {
  name: string
  width: number
  height: number
  targetFps: number
  /** Ponderación de demanda. cpuWeight + gpuWeight = 1. */
  cpuWeight: number
  gpuWeight: number
  workload: Workload
  /** Cómo crece la demanda de GPU con los píxeles respecto de 1080p. */
  pixelExponent: number
  /** Multiplicador de capacidad efectiva del CPU en esta carga. */
  cpuCapacity: number
  /** Multiplicador de capacidad efectiva de la GPU en esta carga. */
  gpuCapacity: number
}

interface Resolution {
  id: string
  width: number
  height: number
}

const RESOLUTIONS: Resolution[] = [
  { id: '1024x768', width: 1024, height: 768 },
  { id: '720p', width: 1280, height: 720 },
  { id: '1080p', width: 1920, height: 1080 },
  { id: '1440p', width: 2560, height: 1440 },
  { id: '4k', width: 3840, height: 2160 },
  { id: '8k', width: 7680, height: 4320 },
]

interface WorkloadDef {
  id: Workload
  pixelExponent: number
  cpuCapacity: number
  gpuCapacity: number
  /** Peso de CPU en 1080p; baja en resoluciones altas. */
  cpuWeightAt1080: number
  cpuWeightPerDoubling: number
}

const WORKLOAD_DEFS: WorkloadDef[] = [
  { id: 'retro', pixelExponent: 0.35, cpuCapacity: 1.1, gpuCapacity: 1.25, cpuWeightAt1080: 0.55, cpuWeightPerDoubling: 0.04 },
  { id: 'esports', pixelExponent: 0.45, cpuCapacity: 0.7, gpuCapacity: 1.25, cpuWeightAt1080: 0.62, cpuWeightPerDoubling: 0.06 },
  { id: 'aaa', pixelExponent: 0.82, cpuCapacity: 1, gpuCapacity: 1, cpuWeightAt1080: 0.42, cpuWeightPerDoubling: 0.08 },
  { id: 'rt', pixelExponent: 1.05, cpuCapacity: 1.05, gpuCapacity: 0.58, cpuWeightAt1080: 0.32, cpuWeightPerDoubling: 0.06 },
  { id: 'path', pixelExponent: 1.28, cpuCapacity: 1.08, gpuCapacity: 0.42, cpuWeightAt1080: 0.22, cpuWeightPerDoubling: 0.05 },
  { id: 'render', pixelExponent: 0.2, cpuCapacity: 0.62, gpuCapacity: 1.15, cpuWeightAt1080: 0.48, cpuWeightPerDoubling: 0.02 },
  { id: 'encode', pixelExponent: 0.12, cpuCapacity: 1, gpuCapacity: 1, cpuWeightAt1080: 0.55, cpuWeightPerDoubling: 0.02 },
]

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function cpuWeightFor(def: WorkloadDef, width: number, height: number): number {
  const pixels = width * height
  const ref = 1920 * 1080
  const doublings = Math.log2(pixels / ref)
  const raw = def.cpuWeightAt1080 - doublings * def.cpuWeightPerDoubling
  return round2(Math.min(0.85, Math.max(0.12, raw)))
}

function buildProfiles(): BenchmarkProfile[] {
  const profiles: BenchmarkProfile[] = []
  for (const res of RESOLUTIONS) {
    for (const def of WORKLOAD_DEFS) {
      if (def.id === 'retro' && res.width * res.height > 1920 * 1080) continue
      if ((def.id === 'rt' || def.id === 'path') && res.width * res.height < 1280 * 720) continue
      if (def.id === 'path' && (res.id === '720p' || res.id === '1024x768')) continue
      const cpuWeight = cpuWeightFor(def, res.width, res.height)
      const gpuWeight = round2(1 - cpuWeight)
      if (round2(cpuWeight + gpuWeight) !== 1) {
        throw new Error(`Pesos de ${res.id}_${def.id} no suman 1`)
      }
      profiles.push({
        name: `${res.id}_${def.id}`,
        width: res.width,
        height: res.height,
        targetFps: def.id === 'esports' ? 144 : def.id === 'retro' ? 30 : 60,
        cpuWeight,
        gpuWeight,
        workload: def.id,
        pixelExponent: def.pixelExponent,
        cpuCapacity: def.cpuCapacity,
        gpuCapacity: def.gpuCapacity,
      })
    }
  }
  return profiles
}

export const BENCHMARK_PROFILES: BenchmarkProfile[] = buildProfiles()

export const RELATIVE_INDEX_PROFILE = {
  name: 'relative_index',
  width: 1920,
  height: 1080,
  targetFps: 60,
  cpuWeight: 0.5,
  gpuWeight: 0.5,
} as const

export function profileByName(name: string): BenchmarkProfile | undefined {
  return BENCHMARK_PROFILES.find((profile) => profile.name === name)
}
