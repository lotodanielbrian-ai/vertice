CREATE TYPE "public"."board_form_factor_enum" AS ENUM('eatx', 'atx', 'micro_atx', 'mini_itx', 'proprietary');--> statement-breakpoint
CREATE TYPE "public"."bus_interface_enum" AS ENUM('isa', 'pci', 'agp_1x', 'agp_2x', 'agp_4x', 'agp_8x', 'pcie_1_0', 'pcie_2_0', 'pcie_3_0', 'pcie_4_0', 'pcie_5_0', 'pcie_6_0');--> statement-breakpoint
CREATE TYPE "public"."component_type_enum" AS ENUM('cpu', 'gpu', 'motherboard', 'ram', 'psu', 'case', 'storage', 'cooler');--> statement-breakpoint
CREATE TYPE "public"."cooler_type_enum" AS ENUM('air', 'liquid', 'stock');--> statement-breakpoint
CREATE TYPE "public"."lod_level_enum" AS ENUM('lod_0_ultra', 'lod_1_high', 'lod_2_low');--> statement-breakpoint
CREATE TYPE "public"."psu_form_factor_enum" AS ENUM('atx', 'sfx', 'sfx_l', 'tfx', 'flex_atx', 'at_legacy');--> statement-breakpoint
CREATE TYPE "public"."psu_modular_type_enum" AS ENUM('non_modular', 'semi_modular', 'full_modular');--> statement-breakpoint
CREATE TYPE "public"."ram_gen_enum" AS ENUM('sdr', 'ddr', 'ddr2', 'ddr3', 'ddr4', 'ddr5');--> statement-breakpoint
CREATE TYPE "public"."storage_interface_enum" AS ENUM('pata', 'sata1', 'sata2', 'sata3', 'sas', 'nvme_3', 'nvme_4', 'nvme_5');--> statement-breakpoint
CREATE TYPE "public"."tier_rating_enum" AS ENUM('S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F');--> statement-breakpoint
CREATE TABLE "asset_3d_rig_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_3d_id" uuid NOT NULL,
	"node_name" varchar(100) NOT NULL,
	"parent_node_id" uuid,
	"node_type" varchar(40) NOT NULL,
	"exploded_offset_vector" jsonb NOT NULL,
	"rotation_axis_vector" jsonb,
	"max_rpm_animation" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "benchmark_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"resolution_width" smallint NOT NULL,
	"resolution_height" smallint NOT NULL,
	"target_fps" smallint DEFAULT 60 NOT NULL,
	"cpu_weight" numeric(3, 2) NOT NULL,
	"gpu_weight" numeric(3, 2) NOT NULL,
	CONSTRAINT "benchmark_profiles_name_unique" UNIQUE("name"),
	CONSTRAINT "chk_weights_range_cpu" CHECK ("benchmark_profiles"."cpu_weight" BETWEEN 0 AND 1),
	CONSTRAINT "chk_weights_range_gpu" CHECK ("benchmark_profiles"."gpu_weight" BETWEEN 0 AND 1),
	CONSTRAINT "chk_weights_sum" CHECK ("benchmark_profiles"."cpu_weight" + "benchmark_profiles"."gpu_weight" = 1.00)
);
--> statement-breakpoint
CREATE TABLE "case_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"supported_form_factors" "board_form_factor_enum"[] NOT NULL,
	"max_gpu_length_mm" integer NOT NULL,
	"max_cooler_height_mm" integer NOT NULL,
	"radiator_support_mm" integer[] NOT NULL,
	"fan_slots" smallint DEFAULT 3 NOT NULL,
	"airflow_score" smallint DEFAULT 50 NOT NULL,
	"psu_form_factor" "psu_form_factor_enum" DEFAULT 'atx' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chipsets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"manufacturer" varchar(50) NOT NULL,
	"pcie_gen_native" "bus_interface_enum",
	"max_memory_channels" smallint DEFAULT 2,
	"supported_ram_gen" "ram_gen_enum" NOT NULL,
	"supports_overclocking" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "component_assets_3d" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"lod_level" "lod_level_enum" NOT NULL,
	"file_format" varchar(10) DEFAULT 'gltf' NOT NULL,
	"mesh_storage_url" text NOT NULL,
	"draco_compressed" boolean DEFAULT true NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"polygon_count" integer NOT NULL,
	"texture_basis_ktx2_url" text,
	"bounding_box_dimensions_mm" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_component_lod" UNIQUE("component_id","lod_level")
);
--> statement-breakpoint
CREATE TABLE "components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"manufacturer" varchar(100) NOT NULL,
	"type" "component_type_enum" NOT NULL,
	"release_date" date NOT NULL,
	"launch_msrp_usd" numeric(10, 2),
	"base_tier" "tier_rating_enum" DEFAULT 'C' NOT NULL,
	"tdp_watts" integer NOT NULL,
	"is_discontinued" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "components_slug_unique" UNIQUE("slug"),
	CONSTRAINT "components_tdp_nonneg" CHECK ("components"."tdp_watts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "cooler_socket_support" (
	"component_id" uuid NOT NULL,
	"socket_id" uuid NOT NULL,
	CONSTRAINT "cooler_socket_support_component_id_socket_id_pk" PRIMARY KEY("component_id","socket_id")
);
--> statement-breakpoint
CREATE TABLE "cooler_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"tdp_max" integer NOT NULL,
	"cooler_type" "cooler_type_enum" NOT NULL,
	"max_rpm" integer NOT NULL,
	"noise_db" numeric(4, 1),
	"height_mm" integer
);
--> statement-breakpoint
CREATE TABLE "cpu_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"socket_id" uuid NOT NULL,
	"architecture" varchar(80) NOT NULL,
	"lithography_nm" numeric(5, 2),
	"die_size_mm2" numeric(6, 2),
	"transistor_count_millions" numeric(10, 2),
	"total_physical_cores" smallint NOT NULL,
	"total_threads" smallint NOT NULL,
	"performance_cores" smallint DEFAULT 0,
	"efficiency_cores" smallint DEFAULT 0,
	"base_clock_mhz" integer,
	"boost_clock_mhz" integer,
	"l1_cache_kb" integer DEFAULT 0 NOT NULL,
	"l2_cache_kb" integer DEFAULT 0 NOT NULL,
	"l3_cache_kb" integer DEFAULT 0 NOT NULL,
	"max_supported_ram_gen" "ram_gen_enum" NOT NULL,
	"max_memory_channels" smallint DEFAULT 2 NOT NULL,
	"integrated_graphics_name" varchar(100),
	"peak_transient_tdp_watts" integer,
	"instruction_sets_supported" text[],
	"ipc_index" numeric(4, 2),
	CONSTRAINT "cpu_cores_positive" CHECK ("cpu_specs"."total_physical_cores" > 0),
	CONSTRAINT "cpu_threads_gte_cores" CHECK ("cpu_specs"."total_threads" >= "cpu_specs"."total_physical_cores")
);
--> statement-breakpoint
CREATE TABLE "gpu_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"architecture" varchar(80) NOT NULL,
	"bus_interface" "bus_interface_enum",
	"bus_lanes" smallint,
	"lithography_nm" numeric(5, 2),
	"base_engine_clock_mhz" integer,
	"boost_engine_clock_mhz" integer,
	"shader_cores_count" integer,
	"texture_mapping_units" smallint,
	"render_output_units" smallint,
	"ray_tracing_cores" smallint DEFAULT 0,
	"tensor_ai_cores" smallint DEFAULT 0,
	"vram_type" varchar(20),
	"vram_capacity_mb" integer,
	"memory_bus_width_bits" smallint,
	"memory_bandwidth_gbps" numeric(8, 2),
	"length_mm" integer,
	"height_mm" integer,
	"slot_width" numeric(3, 1),
	"power_connectors" jsonb,
	"recommended_psu_watts" integer,
	"peak_transient_spike_watts" integer,
	"directx_max_version" numeric(4, 1),
	"vulkan_supported" boolean DEFAULT false NOT NULL,
	"visual_profile" jsonb,
	CONSTRAINT "gpu_bus_lanes_valid" CHECK ("gpu_specs"."bus_lanes" IS NULL OR "gpu_specs"."bus_lanes" IN (1, 2, 4, 8, 16))
);
--> statement-breakpoint
CREATE TABLE "hardware_benchmark_scores" (
	"component_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"normalized_score" numeric(7, 2) NOT NULL,
	"measured_tier" "tier_rating_enum" NOT NULL,
	CONSTRAINT "hardware_benchmark_scores_component_id_profile_id_pk" PRIMARY KEY("component_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "motherboard_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"socket_id" uuid NOT NULL,
	"chipset_id" uuid NOT NULL,
	"form_factor" "board_form_factor_enum" NOT NULL,
	"ram_gen" "ram_gen_enum" NOT NULL,
	"ram_slots" smallint DEFAULT 2 NOT NULL,
	"m2_slots" smallint DEFAULT 0 NOT NULL,
	"pcie_slot" "bus_interface_enum",
	"pcie_lanes" smallint,
	"agp_slot" "bus_interface_enum",
	"storage_interfaces" "storage_interface_enum"[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psu_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"wattage" integer NOT NULL,
	"form_factor" "psu_form_factor_enum" NOT NULL,
	"modular" "psu_modular_type_enum",
	"efficiency" varchar(40) NOT NULL,
	"atx_version" numeric(3, 1) NOT NULL,
	"rail_12v_amps" numeric(6, 1),
	"rail_5v_amps" numeric(6, 1),
	"rail_3v3_amps" numeric(6, 1),
	"connectors" jsonb,
	"topology" varchar(20),
	"has_12vhpwr" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ram_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"gen" "ram_gen_enum" NOT NULL,
	"capacity_mb" integer NOT NULL,
	"modules" smallint DEFAULT 1 NOT NULL,
	"mhz" integer NOT NULL,
	"cas_latency" smallint,
	"voltage" numeric(4, 2)
);
--> statement-breakpoint
CREATE TABLE "saved_builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "socket_chipsets" (
	"socket_id" uuid NOT NULL,
	"chipset_id" uuid NOT NULL,
	CONSTRAINT "socket_chipsets_socket_id_chipset_id_pk" PRIMARY KEY("socket_id","chipset_id")
);
--> statement-breakpoint
CREATE TABLE "sockets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"physical_type" varchar(20) NOT NULL,
	"pin_count" integer NOT NULL,
	"release_year" smallint NOT NULL,
	"max_mounting_pressure_n" numeric(6, 2),
	CONSTRAINT "sockets_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "storage_specs" (
	"component_id" uuid PRIMARY KEY NOT NULL,
	"interface" "storage_interface_enum" NOT NULL,
	"capacity_mb" integer NOT NULL,
	"read_mb_s" integer,
	"kind" varchar(8) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_3d_rig_nodes" ADD CONSTRAINT "asset_3d_rig_nodes_asset_3d_id_component_assets_3d_id_fk" FOREIGN KEY ("asset_3d_id") REFERENCES "public"."component_assets_3d"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_3d_rig_nodes" ADD CONSTRAINT "asset_3d_rig_nodes_parent_node_id_asset_3d_rig_nodes_id_fk" FOREIGN KEY ("parent_node_id") REFERENCES "public"."asset_3d_rig_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_specs" ADD CONSTRAINT "case_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component_assets_3d" ADD CONSTRAINT "component_assets_3d_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooler_socket_support" ADD CONSTRAINT "cooler_socket_support_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooler_socket_support" ADD CONSTRAINT "cooler_socket_support_socket_id_sockets_id_fk" FOREIGN KEY ("socket_id") REFERENCES "public"."sockets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooler_specs" ADD CONSTRAINT "cooler_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cpu_specs" ADD CONSTRAINT "cpu_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cpu_specs" ADD CONSTRAINT "cpu_specs_socket_id_sockets_id_fk" FOREIGN KEY ("socket_id") REFERENCES "public"."sockets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gpu_specs" ADD CONSTRAINT "gpu_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_benchmark_scores" ADD CONSTRAINT "hardware_benchmark_scores_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hardware_benchmark_scores" ADD CONSTRAINT "hardware_benchmark_scores_profile_id_benchmark_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."benchmark_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motherboard_specs" ADD CONSTRAINT "motherboard_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motherboard_specs" ADD CONSTRAINT "motherboard_specs_socket_id_sockets_id_fk" FOREIGN KEY ("socket_id") REFERENCES "public"."sockets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motherboard_specs" ADD CONSTRAINT "motherboard_specs_chipset_id_chipsets_id_fk" FOREIGN KEY ("chipset_id") REFERENCES "public"."chipsets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psu_specs" ADD CONSTRAINT "psu_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ram_specs" ADD CONSTRAINT "ram_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "socket_chipsets" ADD CONSTRAINT "socket_chipsets_socket_id_sockets_id_fk" FOREIGN KEY ("socket_id") REFERENCES "public"."sockets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "socket_chipsets" ADD CONSTRAINT "socket_chipsets_chipset_id_chipsets_id_fk" FOREIGN KEY ("chipset_id") REFERENCES "public"."chipsets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_specs" ADD CONSTRAINT "storage_specs_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rig_asset_parent" ON "asset_3d_rig_nodes" USING btree ("asset_3d_id","parent_node_id");--> statement-breakpoint
CREATE INDEX "idx_components_type_release" ON "components" USING btree ("type","release_date");--> statement-breakpoint
CREATE INDEX "idx_components_base_tier" ON "components" USING btree ("base_tier");--> statement-breakpoint
CREATE INDEX "idx_cpu_socket" ON "cpu_specs" USING btree ("socket_id");--> statement-breakpoint
CREATE INDEX "idx_gpu_bus" ON "gpu_specs" USING btree ("bus_interface");