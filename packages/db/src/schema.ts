import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

/**
 * Esquema Table-per-Type del SRS.
 * Las columnas que el catálogo legado no puede medir (carriles, conectores,
 * relojes, litografía, DirectX) quedan NULL: el seed no inventa esos valores.
 */

export const componentTypeEnum = pgEnum('component_type_enum', [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'psu',
  'case',
  'storage',
  'cooler',
])

export const tierRatingEnum = pgEnum('tier_rating_enum', ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F'])

export const busInterfaceEnum = pgEnum('bus_interface_enum', [
  'isa',
  'pci',
  'agp_1x',
  'agp_2x',
  'agp_4x',
  'agp_8x',
  'pcie_1_0',
  'pcie_2_0',
  'pcie_3_0',
  'pcie_4_0',
  'pcie_5_0',
  'pcie_6_0',
])

export const ramGenEnum = pgEnum('ram_gen_enum', ['sdr', 'ddr', 'ddr2', 'ddr3', 'ddr4', 'ddr5'])

export const psuFormFactorEnum = pgEnum('psu_form_factor_enum', [
  'atx',
  'sfx',
  'sfx_l',
  'tfx',
  'flex_atx',
  'at_legacy',
])

export const psuModularTypeEnum = pgEnum('psu_modular_type_enum', [
  'non_modular',
  'semi_modular',
  'full_modular',
])

export const lodLevelEnum = pgEnum('lod_level_enum', ['lod_0_ultra', 'lod_1_high', 'lod_2_low'])

export const boardFormFactorEnum = pgEnum('board_form_factor_enum', [
  'eatx',
  'atx',
  'micro_atx',
  'mini_itx',
  'proprietary',
])

export const storageInterfaceEnum = pgEnum('storage_interface_enum', [
  'pata',
  'sata1',
  'sata2',
  'sata3',
  'sas',
  'nvme_3',
  'nvme_4',
  'nvme_5',
])

export const coolerTypeEnum = pgEnum('cooler_type_enum', ['air', 'liquid', 'stock'])

export const imageKindEnum = pgEnum('image_kind_enum', ['photo', 'family_fallback', 'manual'])

export const components = pgTable(
  'components',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    manufacturer: varchar('manufacturer', { length: 100 }).notNull(),
    type: componentTypeEnum('type').notNull(),
    releaseDate: date('release_date').notNull(),
    launchMsrpUsd: numeric('launch_msrp_usd', { precision: 10, scale: 2, mode: 'number' }),
    baseTier: tierRatingEnum('base_tier').notNull().default('C'),
    tdpWatts: integer('tdp_watts').notNull(),
    isDiscontinued: boolean('is_discontinued').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_components_type_release').on(table.type, table.releaseDate),
    index('idx_components_base_tier').on(table.baseTier),
    check('components_tdp_nonneg', sql`${table.tdpWatts} >= 0`),
  ],
)

export const sockets = pgTable('sockets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  physicalType: varchar('physical_type', { length: 20 }).notNull(),
  pinCount: integer('pin_count').notNull(),
  releaseYear: smallint('release_year').notNull(),
  maxMountingPressureN: numeric('max_mounting_pressure_n', { precision: 6, scale: 2, mode: 'number' }),
})

export const chipsets = pgTable('chipsets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  manufacturer: varchar('manufacturer', { length: 50 }).notNull(),
  pcieGenNative: busInterfaceEnum('pcie_gen_native'),
  maxMemoryChannels: smallint('max_memory_channels').default(2),
  supportedRamGen: ramGenEnum('supported_ram_gen').notNull(),
  supportsOverclocking: boolean('supports_overclocking').notNull().default(false),
})

export const socketChipsets = pgTable(
  'socket_chipsets',
  {
    socketId: uuid('socket_id')
      .notNull()
      .references(() => sockets.id, { onDelete: 'cascade' }),
    chipsetId: uuid('chipset_id')
      .notNull()
      .references(() => chipsets.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.socketId, table.chipsetId] })],
)

export const cpuSpecs = pgTable(
  'cpu_specs',
  {
    componentId: uuid('component_id')
      .primaryKey()
      .references(() => components.id, { onDelete: 'cascade' }),
    socketId: uuid('socket_id')
      .notNull()
      .references(() => sockets.id, { onDelete: 'restrict' }),
    architecture: varchar('architecture', { length: 80 }).notNull(),
    lithographyNm: numeric('lithography_nm', { precision: 5, scale: 2, mode: 'number' }),
    dieSizeMm2: numeric('die_size_mm2', { precision: 6, scale: 2, mode: 'number' }),
    transistorCountMillions: numeric('transistor_count_millions', {
      precision: 10,
      scale: 2,
      mode: 'number',
    }),
    totalPhysicalCores: smallint('total_physical_cores').notNull(),
    totalThreads: smallint('total_threads').notNull(),
    performanceCores: smallint('performance_cores').default(0),
    efficiencyCores: smallint('efficiency_cores').default(0),
    baseClockMhz: integer('base_clock_mhz'),
    boostClockMhz: integer('boost_clock_mhz'),
    l1CacheKb: integer('l1_cache_kb').notNull().default(0),
    l2CacheKb: integer('l2_cache_kb').notNull().default(0),
    l3CacheKb: integer('l3_cache_kb').notNull().default(0),
    maxSupportedRamGen: ramGenEnum('max_supported_ram_gen').notNull(),
    maxMemoryChannels: smallint('max_memory_channels').notNull().default(2),
    integratedGraphicsName: varchar('integrated_graphics_name', { length: 100 }),
    peakTransientTdpWatts: integer('peak_transient_tdp_watts'),
    instructionSetsSupported: text('instruction_sets_supported').array(),
    ipcIndex: numeric('ipc_index', { precision: 4, scale: 2, mode: 'number' }),
  },
  (table) => [
    index('idx_cpu_socket').on(table.socketId),
    check('cpu_cores_positive', sql`${table.totalPhysicalCores} > 0`),
    check('cpu_threads_gte_cores', sql`${table.totalThreads} >= ${table.totalPhysicalCores}`),
  ],
)

export const gpuSpecs = pgTable(
  'gpu_specs',
  {
    componentId: uuid('component_id')
      .primaryKey()
      .references(() => components.id, { onDelete: 'cascade' }),
    architecture: varchar('architecture', { length: 80 }).notNull(),
    busInterface: busInterfaceEnum('bus_interface'),
    busLanes: smallint('bus_lanes'),
    lithographyNm: numeric('lithography_nm', { precision: 5, scale: 2, mode: 'number' }),
    baseEngineClockMhz: integer('base_engine_clock_mhz'),
    boostEngineClockMhz: integer('boost_engine_clock_mhz'),
    shaderCoresCount: integer('shader_cores_count'),
    textureMappingUnits: smallint('texture_mapping_units'),
    renderOutputUnits: smallint('render_output_units'),
    rayTracingCores: smallint('ray_tracing_cores').default(0),
    tensorAiCores: smallint('tensor_ai_cores').default(0),
    vramType: varchar('vram_type', { length: 20 }),
    vramCapacityMb: integer('vram_capacity_mb'),
    memoryBusWidthBits: smallint('memory_bus_width_bits'),
    memoryBandwidthGbps: numeric('memory_bandwidth_gbps', { precision: 8, scale: 2, mode: 'number' }),
    lengthMm: integer('length_mm'),
    heightMm: integer('height_mm'),
    slotWidth: numeric('slot_width', { precision: 3, scale: 1, mode: 'number' }),
    powerConnectors: jsonb('power_connectors'),
    recommendedPsuWatts: integer('recommended_psu_watts'),
    peakTransientSpikeWatts: integer('peak_transient_spike_watts'),
    directxMaxVersion: numeric('directx_max_version', { precision: 4, scale: 1, mode: 'number' }),
    vulkanSupported: boolean('vulkan_supported').notNull().default(false),
    visualProfile: jsonb('visual_profile'),
  },
  (table) => [
    index('idx_gpu_bus').on(table.busInterface),
    check(
      'gpu_bus_lanes_valid',
      sql`${table.busLanes} IS NULL OR ${table.busLanes} IN (1, 2, 4, 8, 16)`,
    ),
  ],
)

export const motherboardSpecs = pgTable('motherboard_specs', {
  componentId: uuid('component_id')
    .primaryKey()
    .references(() => components.id, { onDelete: 'cascade' }),
  socketId: uuid('socket_id')
    .notNull()
    .references(() => sockets.id, { onDelete: 'restrict' }),
  chipsetId: uuid('chipset_id')
    .notNull()
    .references(() => chipsets.id, { onDelete: 'restrict' }),
  formFactor: boardFormFactorEnum('form_factor').notNull(),
  ramGen: ramGenEnum('ram_gen').notNull(),
  ramSlots: smallint('ram_slots').notNull().default(2),
  m2Slots: smallint('m2_slots').notNull().default(0),
  pcieSlot: busInterfaceEnum('pcie_slot'),
  pcieLanes: smallint('pcie_lanes'),
  agpSlot: busInterfaceEnum('agp_slot'),
  storageInterfaces: storageInterfaceEnum('storage_interfaces').array().notNull(),
})

export const ramSpecs = pgTable('ram_specs', {
  componentId: uuid('component_id')
    .primaryKey()
    .references(() => components.id, { onDelete: 'cascade' }),
  gen: ramGenEnum('gen').notNull(),
  capacityMb: integer('capacity_mb').notNull(),
  modules: smallint('modules').notNull().default(1),
  mhz: integer('mhz').notNull(),
  casLatency: smallint('cas_latency'),
  voltage: numeric('voltage', { precision: 4, scale: 2, mode: 'number' }),
})

export const psuSpecs = pgTable('psu_specs', {
  componentId: uuid('component_id')
    .primaryKey()
    .references(() => components.id, { onDelete: 'cascade' }),
  wattage: integer('wattage').notNull(),
  formFactor: psuFormFactorEnum('form_factor').notNull(),
  modular: psuModularTypeEnum('modular'),
  efficiency: varchar('efficiency', { length: 40 }).notNull(),
  atxVersion: numeric('atx_version', { precision: 3, scale: 1, mode: 'number' }).notNull(),
  rail12vAmps: numeric('rail_12v_amps', { precision: 6, scale: 1, mode: 'number' }),
  rail5vAmps: numeric('rail_5v_amps', { precision: 6, scale: 1, mode: 'number' }),
  rail33vAmps: numeric('rail_3v3_amps', { precision: 6, scale: 1, mode: 'number' }),
  connectors: jsonb('connectors'),
  topology: varchar('topology', { length: 20 }),
  has12vhpwr: boolean('has_12vhpwr').notNull().default(false),
})

export const caseSpecs = pgTable('case_specs', {
  componentId: uuid('component_id')
    .primaryKey()
    .references(() => components.id, { onDelete: 'cascade' }),
  supportedFormFactors: boardFormFactorEnum('supported_form_factors').array().notNull(),
  maxGpuLengthMm: integer('max_gpu_length_mm').notNull(),
  maxCoolerHeightMm: integer('max_cooler_height_mm').notNull(),
  radiatorSupportMm: integer('radiator_support_mm').array().notNull(),
  fanSlots: smallint('fan_slots').notNull().default(3),
  airflowScore: smallint('airflow_score').notNull().default(50),
  psuFormFactor: psuFormFactorEnum('psu_form_factor').notNull().default('atx'),
})

export const storageSpecs = pgTable('storage_specs', {
  componentId: uuid('component_id')
    .primaryKey()
    .references(() => components.id, { onDelete: 'cascade' }),
  interface: storageInterfaceEnum('interface').notNull(),
  capacityMb: integer('capacity_mb').notNull(),
  readMbS: integer('read_mb_s'),
  kind: varchar('kind', { length: 8 }).notNull(),
})

export const coolerSpecs = pgTable('cooler_specs', {
  componentId: uuid('component_id')
    .primaryKey()
    .references(() => components.id, { onDelete: 'cascade' }),
  tdpMax: integer('tdp_max').notNull(),
  coolerType: coolerTypeEnum('cooler_type').notNull(),
  maxRpm: integer('max_rpm').notNull(),
  noiseDb: numeric('noise_db', { precision: 4, scale: 1, mode: 'number' }),
  heightMm: integer('height_mm'),
})

export const coolerSocketSupport = pgTable(
  'cooler_socket_support',
  {
    componentId: uuid('component_id')
      .notNull()
      .references(() => components.id, { onDelete: 'cascade' }),
    socketId: uuid('socket_id')
      .notNull()
      .references(() => sockets.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.componentId, table.socketId] })],
)

export const componentAssets3d = pgTable(
  'component_assets_3d',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    componentId: uuid('component_id')
      .notNull()
      .references(() => components.id, { onDelete: 'cascade' }),
    lodLevel: lodLevelEnum('lod_level').notNull(),
    fileFormat: varchar('file_format', { length: 10 }).notNull().default('gltf'),
    meshStorageUrl: text('mesh_storage_url').notNull(),
    dracoCompressed: boolean('draco_compressed').notNull().default(true),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
    polygonCount: integer('polygon_count').notNull(),
    textureBasisKtx2Url: text('texture_basis_ktx2_url'),
    boundingBoxDimensionsMm: jsonb('bounding_box_dimensions_mm').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('uq_component_lod').on(table.componentId, table.lodLevel)],
)

export const asset3dRigNodes = pgTable(
  'asset_3d_rig_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    asset3dId: uuid('asset_3d_id')
      .notNull()
      .references(() => componentAssets3d.id, { onDelete: 'cascade' }),
    nodeName: varchar('node_name', { length: 100 }).notNull(),
    parentNodeId: uuid('parent_node_id').references((): AnyPgColumn => asset3dRigNodes.id, {
      onDelete: 'cascade',
    }),
    nodeType: varchar('node_type', { length: 40 }).notNull(),
    explodedOffsetVector: jsonb('exploded_offset_vector').notNull(),
    rotationAxisVector: jsonb('rotation_axis_vector'),
    maxRpmAnimation: integer('max_rpm_animation').default(0),
  },
  (table) => [index('idx_rig_asset_parent').on(table.asset3dId, table.parentNodeId)],
)

export const benchmarkProfiles = pgTable(
  'benchmark_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    resolutionWidth: smallint('resolution_width').notNull(),
    resolutionHeight: smallint('resolution_height').notNull(),
    targetFps: smallint('target_fps').notNull().default(60),
    cpuWeight: numeric('cpu_weight', { precision: 3, scale: 2, mode: 'number' }).notNull(),
    gpuWeight: numeric('gpu_weight', { precision: 3, scale: 2, mode: 'number' }).notNull(),
  },
  (table) => [
    check('chk_weights_range_cpu', sql`${table.cpuWeight} BETWEEN 0 AND 1`),
    check('chk_weights_range_gpu', sql`${table.gpuWeight} BETWEEN 0 AND 1`),
    check('chk_weights_sum', sql`${table.cpuWeight} + ${table.gpuWeight} = 1.00`),
  ],
)

export const hardwareBenchmarkScores = pgTable(
  'hardware_benchmark_scores',
  {
    componentId: uuid('component_id')
      .notNull()
      .references(() => components.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => benchmarkProfiles.id, { onDelete: 'cascade' }),
    normalizedScore: numeric('normalized_score', { precision: 7, scale: 2, mode: 'number' }).notNull(),
    measuredTier: tierRatingEnum('measured_tier').notNull(),
    sourceUrl: text('source_url'),
  },
  (table) => [primaryKey({ columns: [table.componentId, table.profileId] })],
)

export const componentImages = pgTable('component_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  componentId: uuid('component_id')
    .notNull()
    .unique()
    .references(() => components.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  thumbUrl: text('thumb_url'),
  sourcePageUrl: text('source_page_url'),
  author: varchar('author', { length: 240 }),
  license: varchar('license', { length: 80 }),
  kind: imageKindEnum('kind').notNull(),
  width: integer('width'),
  height: integer('height'),
})

export const savedBuilds = pgTable('saved_builds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 160 }).notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
