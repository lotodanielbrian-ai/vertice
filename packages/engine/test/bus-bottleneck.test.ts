import { BENCHMARK_PROFILES } from '@pc/shared'
import { describe, expect, it } from 'vitest'
import { analyzeBottleneck } from '../src/bottleneck'
import { analyzeBus } from '../src/bus'
import { build, item } from './fixtures'

function gpu(bus: 'pcie_4_0' | 'pcie_3_0' | 'agp_8x', lanes: number | null, score: number, vramMb = 8192) {
  return item({
    slug: 'gpu',
    type: 'gpu',
    name: 'GPU',
    manufacturer: 'NVIDIA',
    releaseYear: 2022,
    performanceScore: score,
    tdpWatts: 200,
    gpu: {
      architecture: 'Ampere',
      busInterface: bus,
      busLanes: lanes,
      lithographyNm: null,
      baseClockMhz: null,
      boostClockMhz: null,
      shaderCores: null,
      tmus: null,
      rops: null,
      rayTracingCores: 0,
      tensorCores: 0,
      vramType: 'GDDR6',
      vramMb,
      memoryBusWidthBits: null,
      memoryBandwidthGbps: null,
      lengthMm: 270,
      heightMm: null,
      slotWidth: null,
      powerConnectors: null,
      recommendedPsuWatts: null,
      peakTransientSpikeWatts: null,
      directxMax: null,
      vulkan: true,
      visual: { form: 'triple', fans: 3, color: 0, accentColor: 0 },
    },
  })
}

function board(slot: 'pcie_3_0' | 'pcie_4_0' | null, agp: 'agp_8x' | null = null) {
  return item({
    slug: 'mb',
    type: 'motherboard',
    name: 'MB',
    motherboard: {
      socketName: 'AM4',
      chipsetName: 'B550',
      formFactor: 'atx',
      ramGen: 'ddr4',
      ramSlots: 4,
      m2Slots: 2,
      pcieSlot: slot,
      pcieLanes: slot ? 16 : null,
      agpSlot: agp,
      storageInterfaces: ['nvme_4', 'sata3'],
    },
  })
}

const cpu = item({
  slug: 'cpu',
  type: 'cpu',
  name: 'CPU',
  manufacturer: 'AMD',
  performanceScore: 100,
  tdpWatts: 105,
  cpu: {
    socketName: 'AM4',
    architecture: 'Zen 3',
    lithographyNm: 7,
    cores: 8,
    threads: 16,
    performanceCores: 8,
    efficiencyCores: 0,
    baseClockMhz: 3800,
    boostClockMhz: 4500,
    l1CacheKb: 0,
    l2CacheKb: 0,
    l3CacheKb: 32768,
    maxRamGen: 'ddr4',
    maxMemoryChannels: 2,
    integratedGraphics: null,
    peakTransientTdpWatts: 142,
    instructionSets: [],
    ipcIndex: 1.7,
  },
})

describe('bus', () => {
  it('penaliza un enlace PCIe 4 negociado en un slot PCIe 3 sin inventar carriles', () => {
    const report = analyzeBus(build({ gpu: gpu('pcie_4_0', null, 80), motherboard: board('pcie_3_0') }))
    expect(report.negotiatedInterface).toBe('pcie_3_0')
    expect(report.negotiatedLanes).toBeNull()
    expect(report.penalty).toBeGreaterThan(0.15)
    expect(report.penalty).toBeLessThan(0.4)
    expect(report.blocked).toBe(false)
  })

  it('bloquea AGP contra una placa sin esa ranura', () => {
    const report = analyzeBus(build({ gpu: gpu('agp_8x', null, 10, 128), motherboard: board('pcie_3_0') }))
    expect(report.blocked).toBe(true)
  })
})

describe('cuello de botella', () => {
  it('declara los perfiles con pesos que suman 1', () => {
    for (const profile of BENCHMARK_PROFILES) {
      expect(Math.round((profile.cpuWeight + profile.gpuWeight) * 100) / 100).toBe(1)
    }
    expect(BENCHMARK_PROFILES.some((profile) => profile.name === '1024x768_retro')).toBe(true)
    expect(BENCHMARK_PROFILES.some((profile) => profile.name === '8k_path')).toBe(true)
  })

  it('marca la GPU como límite en 4K con una gráfica débil', () => {
    const assembled = build({ cpu, gpu: gpu('pcie_4_0', 16, 15, 2048), motherboard: board('pcie_4_0') })
    const report = analyzeBottleneck(assembled, analyzeBus(assembled), { throttlingRisk: false })
    const fourK = report.profiles.find((profile) => profile.profileName === '4k_aaa')
    expect(fourK?.limiting).toBe('gpu')
    expect(fourK?.gpuUtilization).toBeGreaterThan(fourK?.cpuUtilization ?? 100)
  })

  it('marca el CPU como límite en 1080p eSports cuando el procesador es corto', () => {
    const weakCpu = { ...cpu, performanceScore: 12 }
    const assembled = build({
      cpu: weakCpu,
      gpu: gpu('pcie_4_0', 16, 110, 16384),
      motherboard: board('pcie_4_0'),
    })
    const report = analyzeBottleneck(assembled, analyzeBus(assembled), { throttlingRisk: false })
    const esports = report.profiles.find((profile) => profile.profileName === '1080p_esports')
    expect(esports?.limiting).toBe('cpu')
  })

  it('prioriza el bloque de video en la carga de codificación', () => {
    const assembled = build({ cpu, gpu: gpu('pcie_4_0', 16, 40, 8192), motherboard: board('pcie_4_0') })
    const report = analyzeBottleneck(assembled, analyzeBus(assembled), { throttlingRisk: false })
    const encode = report.profiles.find((profile) => profile.profileName === '1080p_encode')
    expect(encode?.limiting).not.toBe('blocked')
    expect(encode && encode.gpuCapacity).toBeGreaterThan(0)
  })
})
