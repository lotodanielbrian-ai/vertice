import {
  BENCHMARK_PROFILES,
  inferVideoEncode,
  type BenchmarkProfile,
  type ResolvedBuild,
} from '@pc/shared'
import type { BusReport } from './bus'
import type { ThermalReport } from './thermal'

export interface ProfileResult {
  profileName: string
  resolution: string
  workload: BenchmarkProfile['workload']
  limiting: 'cpu' | 'gpu' | 'balanced' | 'blocked'
  imbalancePercent: number
  cpuUtilization: number
  gpuUtilization: number
  busPenalty: number
  cpuCapacity: number
  gpuCapacity: number
}

export interface BottleneckReport {
  profiles: ProfileResult[]
  /** Perfil de referencia para la ruta de actualización: 1440p AAA, o el primero disponible. */
  dominant: ProfileResult | null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function syntheticCpu(build: ResolvedBuild): number {
  const cpu = build.cpu
  if (!cpu?.cpu) return cpu?.performanceScore ?? 0
  if (cpu.performanceScore > 0) return cpu.performanceScore
  const ipc = cpu.cpu.ipcIndex ?? 1
  const clock = cpu.cpu.boostClockMhz ?? cpu.cpu.baseClockMhz ?? 2000
  const eCores = cpu.cpu.efficiencyCores * 0.45
  const pCores = cpu.cpu.performanceCores > 0 ? cpu.cpu.performanceCores : cpu.cpu.cores
  const threads = Math.max(1, pCores + eCores)
  return ipc * (clock / 1000) * Math.sqrt(threads) * 8
}

function syntheticGpu(build: ResolvedBuild): number {
  const gpu = build.gpu
  if (!gpu) return 0
  if (gpu.performanceScore > 0) return gpu.performanceScore
  const vramGb = (gpu.gpu?.vramMb ?? 0) / 1024
  const shaders = gpu.gpu?.shaderCores ?? 0
  return shaders * 0.02 + vramGb * 3
}

function encodeMultipliers(build: ResolvedBuild): { cpu: number; gpu: number } {
  const cpuBlock = build.cpu
    ? inferVideoEncode(build.cpu.manufacturer, build.cpu.cpu?.architecture ?? '', build.cpu.releaseYear)
    : 'none'
  const gpuBlock = build.gpu
    ? inferVideoEncode(build.gpu.manufacturer, build.gpu.gpu?.architecture ?? '', build.gpu.releaseYear)
    : 'none'
  return {
    cpu: cpuBlock === 'quicksync' ? 1.7 : 0.85,
    gpu: gpuBlock === 'nvenc' ? 1.8 : gpuBlock === 'vcn' ? 1.5 : 0.35,
  }
}

export function evaluateProfile(
  build: ResolvedBuild,
  profile: BenchmarkProfile,
  bus: BusReport,
  thermalFactor: number,
): ProfileResult {
  const resolution = `${profile.width}×${profile.height}`
  if (bus.blocked || !build.cpu || !build.gpu) {
    return {
      profileName: profile.name,
      resolution,
      workload: profile.workload,
      limiting: 'blocked',
      imbalancePercent: 0,
      cpuUtilization: 0,
      gpuUtilization: 0,
      busPenalty: bus.penalty,
      cpuCapacity: 0,
      gpuCapacity: 0,
    }
  }

  const pixelRatio = (profile.width * profile.height) / (1920 * 1080)
  const gpuScale = Math.pow(Math.max(pixelRatio, 0.05), profile.pixelExponent)
  const cpuScale = 1 + 0.08 * Math.log2(Math.max(pixelRatio, 0.25))
  const encode = profile.workload === 'encode' ? encodeMultipliers(build) : null
  const cpuMul = encode ? encode.cpu : profile.cpuCapacity
  const gpuMul = encode ? encode.gpu : profile.gpuCapacity

  const cpuCapacity = (syntheticCpu(build) * thermalFactor * cpuMul) / cpuScale
  const gpuCapacity = (syntheticGpu(build) * (1 - bus.penalty) * gpuMul) / gpuScale
  const ratio = gpuCapacity <= 0 ? 0 : cpuCapacity / gpuCapacity

  let limiting: ProfileResult['limiting']
  let imbalancePercent: number
  if (ratio > 1.2) {
    limiting = 'gpu'
    imbalancePercent = clamp((ratio - 1) * 55, 5, 90)
  } else if (ratio < 0.82) {
    limiting = 'cpu'
    imbalancePercent = clamp((1 - ratio) * 70, 5, 90)
  } else {
    limiting = 'balanced'
    imbalancePercent = clamp(Math.abs(1 - ratio) * 25, 0, 12)
  }

  const limitUtil = clamp(78 + imbalancePercent * 0.24, 0, 100)
  const otherUtil = clamp((Math.min(cpuCapacity, gpuCapacity) / Math.max(cpuCapacity, gpuCapacity)) * limitUtil, 0, 100)
  const cpuUtilization = limiting === 'cpu' ? limitUtil : limiting === 'gpu' ? otherUtil : 82
  const gpuUtilization = limiting === 'gpu' ? limitUtil : limiting === 'cpu' ? otherUtil : 82

  return {
    profileName: profile.name,
    resolution,
    workload: profile.workload,
    limiting,
    imbalancePercent: Math.round(imbalancePercent),
    cpuUtilization: Math.round(cpuUtilization),
    gpuUtilization: Math.round(gpuUtilization),
    busPenalty: bus.penalty,
    cpuCapacity,
    gpuCapacity,
  }
}

export function analyzeBottleneck(
  build: ResolvedBuild,
  bus: BusReport,
  thermal: Pick<ThermalReport, 'throttlingRisk'>,
): BottleneckReport {
  const thermalFactor = thermal.throttlingRisk ? 0.72 : 1
  const profiles = BENCHMARK_PROFILES.map((profile) =>
    evaluateProfile(build, profile, bus, thermalFactor),
  )
  const dominant = profiles.find((profile) => profile.profileName === '1440p_aaa') ?? profiles[0] ?? null
  return { profiles, dominant }
}
