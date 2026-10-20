import type { BusInterface, RamGen } from '@pc/shared'

export interface SocketSeed {
  name: string
  physicalType: 'PGA' | 'LGA' | 'BGA' | 'Slot'
  pinCount: number
  releaseYear: number
}

export interface ChipsetSeed {
  name: string
  manufacturer: string
  pcieGenNative: BusInterface | null
  maxMemoryChannels: number
  supportedRamGen: RamGen
  supportsOverclocking: boolean
  sockets: string[]
}

export const SOCKETS: SocketSeed[] = [
  { name: 'Slot 1', physicalType: 'Slot', pinCount: 242, releaseYear: 1997 },
  { name: 'Socket 370', physicalType: 'PGA', pinCount: 370, releaseYear: 1999 },
  { name: 'Socket A', physicalType: 'PGA', pinCount: 462, releaseYear: 2000 },
  { name: 'Socket 478', physicalType: 'PGA', pinCount: 478, releaseYear: 2001 },
  { name: 'Socket 754', physicalType: 'PGA', pinCount: 754, releaseYear: 2003 },
  { name: 'Socket 939', physicalType: 'PGA', pinCount: 939, releaseYear: 2004 },
  { name: 'LGA775', physicalType: 'LGA', pinCount: 775, releaseYear: 2004 },
  { name: 'AM2', physicalType: 'PGA', pinCount: 940, releaseYear: 2006 },
  { name: 'AM2+', physicalType: 'PGA', pinCount: 940, releaseYear: 2007 },
  { name: 'AM3', physicalType: 'PGA', pinCount: 941, releaseYear: 2009 },
  { name: 'AM3+', physicalType: 'PGA', pinCount: 942, releaseYear: 2011 },
  { name: 'LGA1366', physicalType: 'LGA', pinCount: 1366, releaseYear: 2008 },
  { name: 'LGA1156', physicalType: 'LGA', pinCount: 1156, releaseYear: 2009 },
  { name: 'LGA1155', physicalType: 'LGA', pinCount: 1155, releaseYear: 2011 },
  { name: 'LGA1150', physicalType: 'LGA', pinCount: 1150, releaseYear: 2013 },
  { name: 'LGA1151', physicalType: 'LGA', pinCount: 1151, releaseYear: 2015 },
  { name: 'LGA1200', physicalType: 'LGA', pinCount: 1200, releaseYear: 2020 },
  { name: 'LGA1700', physicalType: 'LGA', pinCount: 1700, releaseYear: 2021 },
  { name: 'LGA1851', physicalType: 'LGA', pinCount: 1851, releaseYear: 2024 },
  { name: 'AM4', physicalType: 'PGA', pinCount: 1331, releaseYear: 2016 },
  { name: 'AM5', physicalType: 'LGA', pinCount: 1718, releaseYear: 2022 },
  { name: 'BGA2049', physicalType: 'BGA', pinCount: 2049, releaseYear: 2023 },
]

export const CHIPSETS: ChipsetSeed[] = [
  { name: 'Intel 440BX', manufacturer: 'Intel', pcieGenNative: null, maxMemoryChannels: 1, supportedRamGen: 'sdr', supportsOverclocking: true, sockets: ['Slot 1', 'Socket 370'] },
  { name: 'nForce2', manufacturer: 'NVIDIA', pcieGenNative: null, maxMemoryChannels: 2, supportedRamGen: 'ddr', supportsOverclocking: true, sockets: ['Socket A'] },
  { name: 'Intel 865PE', manufacturer: 'Intel', pcieGenNative: null, maxMemoryChannels: 2, supportedRamGen: 'ddr', supportsOverclocking: true, sockets: ['Socket 478'] },
  { name: 'K8T800', manufacturer: 'VIA', pcieGenNative: null, maxMemoryChannels: 2, supportedRamGen: 'ddr', supportsOverclocking: false, sockets: ['Socket 939', 'Socket 754'] },
  { name: 'P35', manufacturer: 'Intel', pcieGenNative: 'pcie_1_0', maxMemoryChannels: 2, supportedRamGen: 'ddr2', supportsOverclocking: true, sockets: ['LGA775'] },
  { name: 'nForce 570', manufacturer: 'NVIDIA', pcieGenNative: 'pcie_1_0', maxMemoryChannels: 2, supportedRamGen: 'ddr2', supportsOverclocking: true, sockets: ['AM2'] },
  { name: 'AMD 780G', manufacturer: 'AMD', pcieGenNative: 'pcie_2_0', maxMemoryChannels: 2, supportedRamGen: 'ddr2', supportsOverclocking: false, sockets: ['AM2+'] },
  { name: 'AMD 790FX', manufacturer: 'AMD', pcieGenNative: 'pcie_2_0', maxMemoryChannels: 2, supportedRamGen: 'ddr3', supportsOverclocking: true, sockets: ['AM3'] },
  { name: 'AMD 990FX', manufacturer: 'AMD', pcieGenNative: 'pcie_2_0', maxMemoryChannels: 2, supportedRamGen: 'ddr3', supportsOverclocking: true, sockets: ['AM3+'] },
  { name: 'Intel X58', manufacturer: 'Intel', pcieGenNative: 'pcie_2_0', maxMemoryChannels: 3, supportedRamGen: 'ddr3', supportsOverclocking: true, sockets: ['LGA1366'] },
  { name: 'Intel Z68', manufacturer: 'Intel', pcieGenNative: 'pcie_2_0', maxMemoryChannels: 2, supportedRamGen: 'ddr3', supportsOverclocking: true, sockets: ['LGA1155'] },
  { name: 'Intel Z97', manufacturer: 'Intel', pcieGenNative: 'pcie_3_0', maxMemoryChannels: 2, supportedRamGen: 'ddr3', supportsOverclocking: true, sockets: ['LGA1150'] },
  { name: 'Intel Z170', manufacturer: 'Intel', pcieGenNative: 'pcie_3_0', maxMemoryChannels: 2, supportedRamGen: 'ddr4', supportsOverclocking: true, sockets: ['LGA1151'] },
  { name: 'Intel Z390', manufacturer: 'Intel', pcieGenNative: 'pcie_3_0', maxMemoryChannels: 2, supportedRamGen: 'ddr4', supportsOverclocking: true, sockets: ['LGA1151'] },
  { name: 'Intel Z490', manufacturer: 'Intel', pcieGenNative: 'pcie_3_0', maxMemoryChannels: 2, supportedRamGen: 'ddr4', supportsOverclocking: true, sockets: ['LGA1200'] },
  { name: 'Intel Z690', manufacturer: 'Intel', pcieGenNative: 'pcie_5_0', maxMemoryChannels: 2, supportedRamGen: 'ddr5', supportsOverclocking: true, sockets: ['LGA1700'] },
  { name: 'Z790', manufacturer: 'Intel', pcieGenNative: 'pcie_5_0', maxMemoryChannels: 2, supportedRamGen: 'ddr5', supportsOverclocking: true, sockets: ['LGA1700'] },
  { name: 'Intel Z890', manufacturer: 'Intel', pcieGenNative: 'pcie_5_0', maxMemoryChannels: 2, supportedRamGen: 'ddr5', supportsOverclocking: true, sockets: ['LGA1851'] },
  { name: 'AMD A320', manufacturer: 'AMD', pcieGenNative: 'pcie_3_0', maxMemoryChannels: 2, supportedRamGen: 'ddr4', supportsOverclocking: false, sockets: ['AM4'] },
  { name: 'AMD B450', manufacturer: 'AMD', pcieGenNative: 'pcie_3_0', maxMemoryChannels: 2, supportedRamGen: 'ddr4', supportsOverclocking: true, sockets: ['AM4'] },
  { name: 'B550', manufacturer: 'AMD', pcieGenNative: 'pcie_4_0', maxMemoryChannels: 2, supportedRamGen: 'ddr4', supportsOverclocking: true, sockets: ['AM4'] },
  { name: 'AMD X570', manufacturer: 'AMD', pcieGenNative: 'pcie_4_0', maxMemoryChannels: 2, supportedRamGen: 'ddr4', supportsOverclocking: true, sockets: ['AM4'] },
  { name: 'AMD A620', manufacturer: 'AMD', pcieGenNative: 'pcie_4_0', maxMemoryChannels: 2, supportedRamGen: 'ddr5', supportsOverclocking: false, sockets: ['AM5'] },
  { name: 'B650', manufacturer: 'AMD', pcieGenNative: 'pcie_4_0', maxMemoryChannels: 2, supportedRamGen: 'ddr5', supportsOverclocking: true, sockets: ['AM5'] },
  { name: 'X670E', manufacturer: 'AMD', pcieGenNative: 'pcie_5_0', maxMemoryChannels: 2, supportedRamGen: 'ddr5', supportsOverclocking: true, sockets: ['AM5'] },
]
