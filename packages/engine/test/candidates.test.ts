import { describe, expect, it } from 'vitest'
import { evaluateCandidates, invalidatedSlots } from '../src/candidates'
import { EMPTY_CONTEXT } from '../src/context'
import { build, item } from './fixtures'

const cpu = item({
  slug: 'cpu-am5',
  type: 'cpu',
  name: 'AM5',
  cpu: {
    socketName: 'AM5',
    architecture: 'Zen 5',
    lithographyNm: 4,
    cores: 8,
    threads: 16,
    performanceCores: 8,
    efficiencyCores: 0,
    baseClockMhz: 4000,
    boostClockMhz: 5000,
    l1CacheKb: 0,
    l2CacheKb: 0,
    l3CacheKb: 0,
    maxRamGen: 'ddr5',
    maxMemoryChannels: 2,
    integratedGraphics: null,
    peakTransientTdpWatts: 120,
    instructionSets: [],
    ipcIndex: 2,
  },
})

function board(slug: string, socket: string, ram: 'ddr5' | 'ddr4', pcie: 'pcie_5_0' | null, agp: 'agp_8x' | null) {
  return item({
    slug,
    type: 'motherboard',
    name: slug,
    motherboard: {
      socketName: socket,
      chipsetName: 'X',
      formFactor: 'atx',
      ramGen: ram,
      ramSlots: 4,
      m2Slots: 2,
      pcieSlot: pcie,
      pcieLanes: pcie ? 16 : null,
      agpSlot: agp,
      storageInterfaces: ['nvme_4'],
    },
  })
}

describe('candidatos del armado guiado', () => {
  it('deja pasar solo la placa del socket del CPU', () => {
    const am5 = board('mb-am5', 'AM5', 'ddr5', 'pcie_5_0', null)
    const am4 = board('mb-am4', 'AM4', 'ddr4', 'pcie_4_0' as 'pcie_5_0', null)
    const verdicts = evaluateCandidates(build({ cpu }), 'motherboard', [am5, am4, cpu], EMPTY_CONTEXT)
    expect(verdicts.get('mb-am5')?.status).toBe('compatible')
    expect(verdicts.get('mb-am4')?.status).toBe('incompatible')
  })

  it('rechaza RAM de otra generación', () => {
    const ddr5 = item({
      slug: 'ram-ddr5',
      type: 'ram',
      name: 'DDR5',
      ram: { gen: 'ddr5', capacityMb: 32768, modules: 2, mhz: 6000, cas: 30, voltage: 1.35 },
    })
    const ddr4 = item({
      slug: 'ram-ddr4',
      type: 'ram',
      name: 'DDR4',
      ram: { gen: 'ddr4', capacityMb: 16384, modules: 2, mhz: 3200, cas: 16, voltage: 1.35 },
    })
    const verdicts = evaluateCandidates(
      build({ cpu, motherboard: board('mb-am5', 'AM5', 'ddr5', 'pcie_5_0', null) }),
      'ram',
      [ddr5, ddr4],
      EMPTY_CONTEXT,
    )
    expect(verdicts.get('ram-ddr5')?.status).toBe('compatible')
    expect(verdicts.get('ram-ddr4')?.status).toBe('incompatible')
  })

  it('marca una GPU AGP como incompatible en una placa PCIe', () => {
    const agp = item({
      slug: 'gpu-agp',
      type: 'gpu',
      name: 'AGP',
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
    const verdicts = evaluateCandidates(
      build({ motherboard: board('mb-am5', 'AM5', 'ddr5', 'pcie_5_0', null) }),
      'gpu',
      [agp],
      EMPTY_CONTEXT,
    )
    expect(verdicts.get('gpu-agp')?.status).toBe('incompatible')
    expect(invalidatedSlots(build({ cpu, motherboard: board('mb-am4', 'AM4', 'ddr4', 'pcie_5_0', null) }), EMPTY_CONTEXT)).toContain('cpu')
  })
})
