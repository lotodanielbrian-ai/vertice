import { describe, expect, it } from 'vitest'
import { checkCompatibility } from '../src/compatibility'
import { EMPTY_CONTEXT } from '../src/context'
import { build, item } from './fixtures'

const cpu = item({
  slug: 'cpu',
  type: 'cpu',
  name: 'CPU',
  tdpWatts: 120,
  cpu: {
    socketName: 'AM5',
    architecture: 'Zen 5',
    lithographyNm: 4,
    cores: 8,
    threads: 16,
    performanceCores: 8,
    efficiencyCores: 0,
    baseClockMhz: 4700,
    boostClockMhz: 5200,
    l1CacheKb: 640,
    l2CacheKb: 8192,
    l3CacheKb: 98304,
    maxRamGen: 'ddr5',
    maxMemoryChannels: 2,
    integratedGraphics: null,
    peakTransientTdpWatts: 160,
    instructionSets: ['AVX2'],
    ipcIndex: 2,
  },
})

describe('compatibilidad', () => {
  it('rechaza un socket distinto', () => {
    const board = item({
      slug: 'mb',
      type: 'motherboard',
      name: 'B550',
      motherboard: {
        socketName: 'AM4',
        chipsetName: 'B550',
        formFactor: 'atx',
        ramGen: 'ddr4',
        ramSlots: 4,
        m2Slots: 2,
        pcieSlot: 'pcie_4_0',
        pcieLanes: 16,
        agpSlot: null,
        storageInterfaces: ['sata3', 'nvme_4'],
      },
    })
    const issues = checkCompatibility(build({ cpu, motherboard: board }), EMPTY_CONTEXT)
    expect(issues.some((issue) => issue.code === 'SOCKET_MISMATCH' && issue.severity === 'error')).toBe(
      true,
    )
  })

  it('rechaza una GPU AGP en una placa solo PCIe', () => {
    const gpu = item({
      slug: 'gpu',
      type: 'gpu',
      name: '9700 PRO',
      gpu: {
        architecture: 'R300',
        busInterface: 'agp_8x',
        busLanes: null,
        lithographyNm: null,
        baseClockMhz: null,
        boostClockMhz: null,
        shaderCores: null,
        tmus: null,
        rops: null,
        rayTracingCores: 0,
        tensorCores: 0,
        vramType: 'DDR',
        vramMb: 128,
        memoryBusWidthBits: null,
        memoryBandwidthGbps: null,
        lengthMm: 190,
        heightMm: null,
        slotWidth: null,
        powerConnectors: null,
        recommendedPsuWatts: null,
        peakTransientSpikeWatts: null,
        directxMax: null,
        vulkan: false,
        visual: { form: 'retro-tiny', fans: 1, color: 0, accentColor: 0 },
      },
    })
    const board = item({
      slug: 'mb',
      type: 'motherboard',
      name: 'Z790',
      motherboard: {
        socketName: 'LGA1700',
        chipsetName: 'Z790',
        formFactor: 'atx',
        ramGen: 'ddr5',
        ramSlots: 4,
        m2Slots: 4,
        pcieSlot: 'pcie_5_0',
        pcieLanes: 16,
        agpSlot: null,
        storageInterfaces: ['nvme_4'],
      },
    })
    const issues = checkCompatibility(build({ gpu, motherboard: board }), EMPTY_CONTEXT)
    expect(issues.find((issue) => issue.code === 'BUS_PHYSICAL')?.severity).toBe('error')
  })

  it('avisa, sin error, cuando PCIe negocia una generación menor', () => {
    const gpu = item({
      slug: 'gpu',
      type: 'gpu',
      name: 'GPU',
      gpu: {
        architecture: 'RDNA 3',
        busInterface: 'pcie_4_0',
        busLanes: 16,
        lithographyNm: null,
        baseClockMhz: null,
        boostClockMhz: null,
        shaderCores: null,
        tmus: null,
        rops: null,
        rayTracingCores: 0,
        tensorCores: 0,
        vramType: 'GDDR6',
        vramMb: 16384,
        memoryBusWidthBits: null,
        memoryBandwidthGbps: null,
        lengthMm: 280,
        heightMm: null,
        slotWidth: null,
        powerConnectors: { pcie_8pin: 2 },
        recommendedPsuWatts: null,
        peakTransientSpikeWatts: null,
        directxMax: null,
        vulkan: true,
        visual: { form: 'triple', fans: 3, color: 0, accentColor: 0 },
      },
    })
    const board = item({
      slug: 'mb',
      type: 'motherboard',
      name: 'Vieja',
      motherboard: {
        socketName: 'AM4',
        chipsetName: 'B450',
        formFactor: 'atx',
        ramGen: 'ddr4',
        ramSlots: 4,
        m2Slots: 1,
        pcieSlot: 'pcie_3_0',
        pcieLanes: 16,
        agpSlot: null,
        storageInterfaces: ['sata3'],
      },
    })
    const issues = checkCompatibility(build({ gpu, motherboard: board }), EMPTY_CONTEXT)
    expect(issues.find((issue) => issue.code === 'BUS_DOWNGRADE')?.severity).toBe('info')
    expect(issues.some((issue) => issue.code === 'BUS_PHYSICAL')).toBe(false)
  })

  it('exige el conector 12VHPWR cuando la GPU lo declara', () => {
    const gpu = item({
      slug: 'gpu',
      type: 'gpu',
      name: '5090',
      tdpWatts: 575,
      gpu: {
        architecture: 'Blackwell',
        busInterface: 'pcie_5_0',
        busLanes: 16,
        lithographyNm: null,
        baseClockMhz: null,
        boostClockMhz: null,
        shaderCores: null,
        tmus: null,
        rops: null,
        rayTracingCores: 0,
        tensorCores: 0,
        vramType: 'GDDR7',
        vramMb: 32768,
        memoryBusWidthBits: 512,
        memoryBandwidthGbps: null,
        lengthMm: 340,
        heightMm: null,
        slotWidth: null,
        powerConnectors: { hpwr_16pin: 1 },
        recommendedPsuWatts: 1000,
        peakTransientSpikeWatts: null,
        directxMax: null,
        vulkan: true,
        visual: { form: 'massive', fans: 3, color: 0, accentColor: 0 },
      },
    })
    const psu = item({
      slug: 'psu',
      type: 'psu',
      name: '650W',
      psu: {
        wattage: 650,
        formFactor: 'atx',
        modular: 'non_modular',
        efficiency: '80+ Bronze',
        atxVersion: 2.4,
        rail12vAmps: null,
        rail5vAmps: null,
        rail33vAmps: null,
        connectors: { pcie_8pin: 2 },
        topology: 'dc_dc',
        has12vhpwr: false,
      },
    })
    const issues = checkCompatibility(build({ gpu, psu }), EMPTY_CONTEXT)
    expect(issues.some((issue) => issue.code === 'GPU_POWER_CONNECTORS')).toBe(true)
  })
})
