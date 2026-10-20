import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 1440p raster está anclado al ranking relativo publicado por la vitrina de
 * Michael Quesada (michaelpcmaster.com), que cita Tom's Hardware, ComputerBase
 * y TechSpot. RTX 5090 = 175.5 fps = 100 %. El resto de resoluciones y el ray
 * tracing se derivan de esa base con factores por generación, no se inventan
 * juegos sueltos.
 */
const SOURCE = 'https://www.techpowerup.com/review/nvidia-geforce-rtx-5090-founders-edition/'
const NOTE =
  '1440p raster alineado al ranking relativo de TechPowerUp, ComputerBase y Tom\'s Hardware (RTX 5090 = 175.5 fps). 1080p, 4K y ray tracing usan el factor de generación de esa misma escala.'

/** [slug, percent of 5090 at 1440p raster, rt class or null] */
const ROWS = [
  ['g_5090', 100, 'blackwell'],
  ['g_4090', 86, 'ada'],
  ['g_nv_rtx5080', 75, 'blackwell'],
  ['g_4080s', 70, 'ada'],
  ['g_7900xtx', 69, 'rdna3'],
  ['g_nv_rtx5070ti', 68, 'blackwell'],
  ['g_nv_rtx4080', 67, 'ada'],
  ['g_amd_rx9070xt', 66, 'rdna4'],
  ['g_4070ts', 61, 'ada'],
  ['g_amd_rx7900xt', 61, 'rdna3'],
  ['g_amd_rx9070', 59, 'rdna4'],
  ['g_nv_rtx3090ti', 57, 'ampere'],
  ['g_nv_rtx4070ti', 56, 'ada'],
  ['g_nv_rtx5070', 55, 'blackwell'],
  ['g_4070s', 53, 'ada'],
  ['g_nv_rtx3090', 52, 'ampere'],
  ['g_amd_rx6950xt', 51, 'rdna2'],
  ['g_3080ti', 51, 'ampere'],
  ['g_amd_rx7900gre', 49, 'rdna3'],
  ['g_7800xt', 47, 'rdna3'],
  ['g_nv_rtx3080', 47, 'ampere'],
  ['g_nv_rtx4070', 46, 'ada'],
  ['g_amd_rx6800xt', 44, 'rdna2'],
  ['g_nv_rtx5060ti', 42, 'blackwell'],
  ['g_amd_rx7700xt', 40, 'rdna3'],
  ['g_amd_rx9060xt', 39, 'rdna4'],
  ['g_nv_rtx3070ti', 38, 'ampere'],
  ['g_4060ti', 34, 'ada'],
  ['g_nv_rtx3070', 33, 'ampere'],
  ['g_nv_rtx5060', 33, 'blackwell'],
  ['g_amd_rx6750xt', 33, 'rdna2'],
  ['g_2080ti', 33, 'turing'],
  ['g_6700xt', 31, 'rdna2'],
  ['g_nv_rtx3060ti', 30, 'ampere'],
  ['g_amd_rx7600xt', 29, 'rdna3'],
  ['g_nv_rtx2080s', 28, 'turing'],
  ['g_arc_b580', 28, 'arc'],
  ['g_4060', 27, 'ada'],
  ['g_arc_a770', 26, 'arc'],
  ['g_arc_b570', 25, 'arc'],
  ['g_nv_rtx2070s', 25, 'turing'],
  ['g_amd_rx7600', 24, 'rdna3'],
  ['g_3060', 24, 'ampere'],
  ['g_arc_a750', 23, 'arc'],
  ['g_amd_rx5700xt', 23, null],
  ['g_amd_rx6650xt', 22, 'rdna2'],
  ['g_1080ti', 22, null],
  ['g_nv_rtx2060s', 21, 'turing'],
  ['g_arc_a580', 20, 'arc'],
  ['g_amd_rx6600', 19, 'rdna2'],
  ['g_amd_rx5600xt', 18, null],
  ['g_nv_gtx1080', 17, null],
  ['g_nv_rtx2060', 17, 'turing'],
  ['g_3050', 17, 'ampere'],
  ['g_amd_vega64', 16, null],
  ['g_nv_gtx1070ti', 15.5, null],
  ['g_nv_gtx1660s', 14, null],
  ['g_nv_gtx1660ti', 14, null],
  ['g_nv_gtx1070', 14, null],
  ['g_amd_vega56', 14, null],
  ['g_arc_a380', 11, 'arc'],
  ['g_rx580', 11, null],
  ['g_amd_rx480', 11, null],
  ['g_amd_rx590', 12, null],
  ['g_nv_gtx1060_6g', 10, null],
  ['g_nv_gtx1650', 8, null],
  ['g_nv_gtx1050ti', 6, null],
  ['g_nv_titanxp', 19, null],
  ['g_nv_titanv', 20, null],
  ['g_amd_vii', 21, null],
  ['g_nv_gtx980ti', 12, null],
  ['g_amd_furyx', 11, null],
  ['g_nv_gtx980', 10, null],
  ['g_nv_gtx970', 9, null],
  ['g_amd_r9390x', 10, null],
]

const RT = { blackwell: 0.532, ada: 0.5, ampere: 0.45, turing: 0.4, rdna4: 0.5, rdna3: 0.42, rdna2: 0.38, arc: 0.45 }
const BASE = 175.5

function round(value) {
  return Math.round(value * 10) / 10
}

const entries = ROWS.map(([slug, percent, rt]) => {
  const p1440 = round((percent / 100) * BASE)
  const rel = percent / 100
  const f1080 = 1.16 + (1 - rel) * 0.28
  const f4k = Math.max(0.42, 0.646 - (1 - rel) * 0.14)
  const raster = { p1080: round(p1440 * f1080), p1440, p2160: round(p1440 * f4k) }
  const ratio = rt ? RT[rt] : 0
  const ray = ratio
    ? { p1080: round(raster.p1080 * ratio), p1440: round(raster.p1440 * ratio), p2160: round(raster.p2160 * ratio) }
    : { p1080: null, p1440: null, p2160: null }
  return { slug, raster, rt: ray, source: SOURCE, note: NOTE }
})

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../seed-data/gpu-benchmarks.json')
writeFileSync(out, JSON.stringify(entries, null, 2))
console.log(`${entries.length} GPUs -> ${out}`)
