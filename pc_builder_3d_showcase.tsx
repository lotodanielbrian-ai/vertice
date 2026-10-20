import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cpu, Monitor, HardDrive, Zap, CircuitBoard, MemoryStick, AlertTriangle, 
  CheckCircle2, Search, RotateCw, Settings, Scale, Layers, Box, Flame, 
  Sliders, ArrowUpRight, Sparkles, History, Wind, ShieldAlert, Award
} from 'lucide-react';

const customStyles = `
  @keyframes argb-flow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
  @keyframes rgb-border-pulse {
    0% { border-color: #ff0055; box-shadow: 0 0 15px rgba(255, 0, 85, 0.4); }
    33% { border-color: #00e5ff; box-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
    66% { border-color: #7000ff; box-shadow: 0 0 15px rgba(112, 0, 255, 0.4); }
    100% { border-color: #ff0055; box-shadow: 0 0 15px rgba(255, 0, 85, 0.4); }
  }
  .argb-text {
    background: linear-gradient(90deg, #ff007f, #00f0ff, #7928ca, #ff007f);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: argb-flow 6s linear infinite;
  }
  .argb-border-active {
    animation: rgb-border-pulse 4s ease-in-out infinite;
  }
  .glass-panel {
    background: rgba(13, 18, 30, 0.85);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(10, 14, 23, 0.7); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
`;

const hardwareDb = {
  gpu: [
    // =========================================================================
    // 1. ERA ATI TECHNOLOGIES (2000 – 2006)
    // =========================================================================
    // Serie Radeon R100 (2000)
    { id: 'g_ati_7000', name: 'ATI Radeon VE / 7000 (R100)', year: 2000, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R100', tier: 'D', price: 15, vram: '32MB SDR', tdp: 12, score: 2, fans: 0, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 165, color: 0x991b1b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_ddr', name: 'ATI Radeon DDR 64MB / 7200', year: 2000, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R100', tier: 'D', price: 20, vram: '64MB DDR', tdp: 23, score: 3, fans: 1, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 175, color: 0x991b1b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    
    // Serie Radeon R200 (2001 – 2002) - DirectX 8.1
    { id: 'g_ati_8500', name: 'ATI Radeon 8500 (DX8.1 Flagship)', year: 2001, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R200', tier: 'D', price: 25, vram: '64MB DDR', tdp: 28, score: 4, fans: 1, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 180, color: 0x991b1b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_9200', name: 'ATI Radeon 9200 / 9250', year: 2003, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R200', tier: 'D', price: 18, vram: '128MB DDR', tdp: 25, score: 3, fans: 0, form: 'retro-tiny', pcie: 'AGP 8X', lengthMm: 170, color: 0x1e3a8a, accentColor: 0x3b82f6, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon R300 (2002 – 2004) - Hito Histórico DirectX 9
    { id: 'g_9700pro', name: 'ATI Radeon 9700 PRO (2002 DX9 Legend)', year: 2002, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R300', tier: 'D', price: 30, vram: '128MB DDR', tdp: 45, score: 5, fans: 1, form: 'retro-tiny', pcie: 'AGP 8X', lengthMm: 190, color: 0x991b1b, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_9600xt', name: 'ATI Radeon 9600 XT', year: 2003, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R300', tier: 'D', price: 22, vram: '128MB DDR', tdp: 38, score: 4, fans: 1, form: 'retro-tiny', pcie: 'AGP 8X', lengthMm: 185, color: 0x991b1b, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_9800xt', name: 'ATI Radeon 9800 XT (R360 Flagship)', year: 2003, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R300', tier: 'D', price: 35, vram: '256MB DDR', tdp: 60, score: 6, fans: 1, form: 'retro-single', pcie: 'AGP 8X', lengthMm: 210, color: 0x991b1b, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon R400 / X-Series (2004 – 2005) - Transición PCI-Express
    { id: 'g_ati_x800xt', name: 'ATI Radeon X800 XT Platinum Edition', year: 2004, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R420', tier: 'D', price: 30, vram: '256MB GDDR3', tdp: 63, score: 8, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 215, color: 0x991b1b, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_x850xtpe', name: 'ATI Radeon X850 XT PE (Platinum)', year: 2004, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R480', tier: 'D', price: 35, vram: '256MB GDDR3', tdp: 70, score: 9, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 220, color: 0x991b1b, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon X1000 (2005 – 2006) - Shader Model 3.0 & GDDR4
    { id: 'g_ati_x1650xt', name: 'ATI Radeon X1650 XT (SM 3.0)', year: 2006, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R560', tier: 'D', price: 25, vram: '256MB GDDR3', tdp: 55, score: 9, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 210, color: 0x991b1b, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_x1950xtx', name: 'ATI Radeon X1950 XTX (Primera GDDR4)', year: 2006, brand: 'ATI', era: 'ati_2000_2006', architecture: 'R580+', tier: 'D', price: 40, vram: '512MB GDDR4', tdp: 125, score: 12, fans: 1, form: 'blower', pcie: 'PCIe 1.0', lengthMm: 235, color: 0xb91c1c, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // =========================================================================
    // 2. TRANSICIÓN ATI-AMD (2007 – 2010)
    // =========================================================================
    // Serie Radeon HD 2000 (2007) - DirectX 10
    { id: 'g_ati_hd2900xt', name: 'ATI Radeon HD 2900 XT (DX10 Debut)', year: 2007, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 1', tier: 'D', price: 35, vram: '512MB GDDR3', tdp: 215, score: 13, fans: 1, form: 'blower', pcie: 'PCIe 1.1', lengthMm: 240, color: 0x991b1b, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    
    // Serie Radeon HD 3000 (2007 – 2008)
    { id: 'g_ati_hd3870', name: 'ATI Radeon HD 3870 512MB GDDR4', year: 2007, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 1', tier: 'D', price: 30, vram: '512MB GDDR4', tdp: 106, score: 14, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 230, color: 0xb91c1c, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_hd3870x2', name: 'ATI Radeon HD 3870 X2 (Dual-GPU Monster)', year: 2008, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 1', tier: 'D', price: 45, vram: '1GB (2x512MB)', tdp: 195, score: 17, fans: 1, form: 'dual-gpu', pcie: 'PCIe 2.0', lengthMm: 270, color: 0x7f1d1d, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon HD 4000 (2008 – 2009) - Democratización GDDR5
    { id: 'g_ati_hd4870', name: 'ATI Radeon HD 4870 1GB (GDDR5 Pioneer)', year: 2008, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 1', tier: 'D', price: 35, vram: '1GB GDDR5', tdp: 157, score: 18, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 241, color: 0xb91c1c, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_hd4890', name: 'ATI Radeon HD 4890 (RV790 1GHz King)', year: 2009, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 1', tier: 'D', price: 40, vram: '1GB GDDR5', tdp: 190, score: 20, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 241, color: 0x991b1b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_hd4870x2', name: 'ATI Radeon HD 4870 X2 (Dual-RV770 2GB)', year: 2008, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 1', tier: 'D', price: 55, vram: '2GB GDDR5', tdp: 286, score: 24, fans: 1, form: 'dual-gpu', pcie: 'PCIe 2.0', lengthMm: 270, color: 0x7f1d1d, accentColor: 0xf87171, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon HD 5000 / Evergreen (2009 – 2010) - DirectX 11 & Eyefinity
    { id: 'g_ati_hd5770', name: 'ATI Radeon HD 5770 (Juniper XT)', year: 2009, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 2', tier: 'D', price: 35, vram: '1GB GDDR5', tdp: 108, score: 21, fans: 1, form: 'blower', pcie: 'PCIe 2.1', lengthMm: 218, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_hd5870', name: 'ATI Radeon HD 5870 (Cypress XT Legend)', year: 2009, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 2', tier: 'D', price: 45, vram: '1GB GDDR5', tdp: 188, score: 26, fans: 1, form: 'blower', pcie: 'PCIe 2.1', lengthMm: 280, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_ati_hd5970', name: 'ATI Radeon HD 5970 (Dual-Hemlock Ultra)', year: 2009, brand: 'ATI', era: 'trans_2007_2010', architecture: 'TeraScale 2', tier: 'D', price: 65, vram: '2GB GDDR5', tdp: 294, score: 32, fans: 1, form: 'dual-gpu', pcie: 'PCIe 2.1', lengthMm: 310, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // =========================================================================
    // 3. ERA AMD RADEON (2010 – 2019)
    // =========================================================================
    // Serie Radeon HD 6000 (2010 – 2011)
    { id: 'g_amd_hd6870', name: 'AMD Radeon HD 6870 Barts XT', year: 2010, brand: 'AMD', era: 'amd_2010_2019', architecture: 'TeraScale 2', tier: 'D', price: 38, vram: '1GB GDDR5', tdp: 151, score: 24, fans: 1, form: 'blower', pcie: 'PCIe 2.1', lengthMm: 245, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_hd6970', name: 'AMD Radeon HD 6970 Cayman XT', year: 2010, brand: 'AMD', era: 'amd_2010_2019', architecture: 'TeraScale 3', tier: 'D', price: 45, vram: '2GB GDDR5', tdp: 250, score: 29, fans: 1, form: 'blower', pcie: 'PCIe 2.1', lengthMm: 275, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_hd6990', name: 'AMD Radeon HD 6990 (Antilles Dual 4GB)', year: 2011, brand: 'AMD', era: 'amd_2010_2019', architecture: 'TeraScale 3', tier: 'D', price: 75, vram: '4GB (2x2GB)', tdp: 375, score: 38, fans: 1, form: 'dual-gpu', pcie: 'PCIe 2.1', lengthMm: 305, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon HD 7000 (2011 – 2013) - Estreno GCN 28nm
    { id: 'g_amd_hd7870', name: 'AMD Radeon HD 7870 GHz Edition', year: 2012, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 1.0', tier: 'D', price: 45, vram: '2GB GDDR5', tdp: 175, score: 31, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 240, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_hd7970', name: 'AMD Radeon HD 7970 GHz Edition (Tahiti)', year: 2012, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 1.0', tier: 'C', price: 60, vram: '3GB GDDR5', tdp: 250, score: 37, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 275, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_hd7990', name: 'AMD Radeon HD 7990 (Malta Dual 6GB)', year: 2013, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 1.0', tier: 'C', price: 95, vram: '6GB (2x3GB)', tdp: 375, score: 45, fans: 3, form: 'dual-gpu', pcie: 'PCIe 3.0', lengthMm: 305, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Series Radeon R9 200 / 300 / Fury (2013 – 2016)
    { id: 'g_amd_r9290x', name: 'AMD Radeon R9 290X (Hawaii XT 512-bit)', year: 2013, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 2.0', tier: 'C', price: 70, vram: '4GB GDDR5', tdp: 290, score: 41, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 277, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_r9390x', name: 'AMD Radeon R9 390X 8GB (Grenada XT)', year: 2015, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 2.0', tier: 'C', price: 85, vram: '8GB GDDR5', tdp: 275, score: 46, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 277, color: 0x27272a, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_furyx', name: 'AMD Radeon R9 Fury X (Fiji HBM Liquid)', year: 2015, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 3.0', tier: 'B', price: 130, vram: '4GB HBM 4096-bit', tdp: 275, score: 53, fans: 1, form: 'liquid-aio', pcie: 'PCIe 3.0', lengthMm: 195, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_produo', name: 'AMD Radeon Pro Duo (Dual-Fiji 8GB HBM)', year: 2016, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 3.0', tier: 'B', price: 180, vram: '8GB HBM', tdp: 350, score: 60, fans: 1, form: 'dual-gpu', pcie: 'PCIe 3.0', lengthMm: 280, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Series Polaris RX 400 & RX 500 (2016 – 2019)
    { id: 'g_amd_rx480', name: 'AMD Radeon RX 480 8GB Polaris', year: 2016, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 4.0', tier: 'C', price: 75, vram: '8GB GDDR5', tdp: 150, score: 40, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 241, color: 0x18181b, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_rx580', name: 'AMD Radeon RX 580 8GB (Democratizing King)', year: 2017, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 4.0', tier: 'C', price: 90, vram: '8GB GDDR5', tdp: 185, score: 43, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 240, color: 0x18181b, accentColor: 0xb91c1c, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx590', name: 'AMD Radeon RX 590 8GB 12nm', year: 2018, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 4.0', tier: 'C', price: 105, vram: '8GB GDDR5', tdp: 225, score: 47, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 260, color: 0x27272a, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon RX Vega & Radeon VII (2017 – 2019)
    { id: 'g_amd_vega56', name: 'AMD Radeon RX Vega 56 8GB HBM2', year: 2017, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 5.0', tier: 'B', price: 120, vram: '8GB HBM2', tdp: 210, score: 55, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x3f3f46, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_vega64', name: 'AMD Radeon RX Vega 64 8GB HBM2', year: 2017, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 5.0', tier: 'B', price: 140, vram: '8GB HBM2', tdp: 295, score: 60, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x3f3f46, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_vii', name: 'AMD Radeon VII 16GB HBM2 (Primer 7nm)', year: 2019, brand: 'AMD', era: 'amd_2010_2019', architecture: 'GCN 5.0', tier: 'B', price: 230, vram: '16GB HBM2 (1TB/s)', tdp: 300, score: 68, fans: 3, form: 'triple', pcie: 'PCIe 3.0', lengthMm: 268, color: 0x71717a, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // =========================================================================
    // 4. ERA MODERNA: RDNA (2019 – 2026)
    // =========================================================================
    // Serie Radeon RX 5000 / RDNA 1 (2019 – 2020)
    { id: 'g_amd_rx5600xt', name: 'AMD Radeon RX 5600 XT 6GB', year: 2020, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 1', tier: 'C', price: 150, vram: '6GB GDDR6', tdp: 150, score: 54, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 240, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx5700xt', name: 'AMD Radeon RX 5700 XT 8GB', year: 2019, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 1', tier: 'B', price: 190, vram: '8GB GDDR6', tdp: 225, score: 64, fans: 1, form: 'blower', pcie: 'PCIe 4.0', lengthMm: 272, color: 0x52525b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon RX 6000 / RDNA 2 (2020 – 2022)
    { id: 'g_6700xt', name: 'AMD Radeon RX 6700 XT 12GB', year: 2021, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 2', tier: 'B', price: 320, vram: '12GB GDDR6', tdp: 230, score: 68, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 267, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx6800xt', name: 'AMD Radeon RX 6800 XT 16GB', year: 2020, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 2', tier: 'A', price: 440, vram: '16GB GDDR6', tdp: 300, score: 81, fans: 3, form: 'triple', pcie: 'PCIe 4.0', lengthMm: 267, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx6950xt', name: 'AMD Radeon RX 6950 XT 16GB Flagship', year: 2022, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 2', tier: 'S', price: 580, vram: '16GB GDDR6', tdp: 335, score: 89, fans: 3, form: 'triple', pcie: 'PCIe 4.0', lengthMm: 267, color: 0x09090b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon RX 7000 / RDNA 3 (2022 – 2024) - Chiplets
    { id: 'g_amd_rx7600xt', name: 'AMD Radeon RX 7600 XT 16GB', year: 2024, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 3', tier: 'B', price: 319, vram: '16GB GDDR6', tdp: 190, score: 62, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 235, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_7800xt', name: 'AMD Radeon RX 7800 XT 16GB', year: 2023, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 3', tier: 'A', price: 489, vram: '16GB GDDR6', tdp: 263, score: 80, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 267, color: 0x27272a, accentColor: 0xdc2626, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx7900gre', name: 'AMD Radeon RX 7900 GRE 16GB', year: 2024, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 3', tier: 'A', price: 539, vram: '16GB GDDR6', tdp: 260, score: 84, fans: 3, form: 'triple', pcie: 'PCIe 4.0', lengthMm: 280, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_7900xtx', name: 'AMD Radeon RX 7900 XTX 24GB (Chiplet)', year: 2022, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 3', tier: 'S', price: 929, vram: '24GB GDDR6', tdp: 355, score: 94, fans: 3, form: 'massive', pcie: 'PCIe 4.0', lengthMm: 287, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Serie Radeon RX 9000 / RDNA 4 (2025 – 2026) & IA Instinct
    { id: 'g_amd_rx9060xt', name: 'AMD Radeon RX 9060 XT (RDNA 4)', year: 2025, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 4', tier: 'B', price: 379, vram: '16GB GDDR6', tdp: 180, score: 76, fans: 2, form: 'dual', pcie: 'PCIe 5.0', lengthMm: 245, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx9070', name: 'AMD Radeon RX 9070 16GB (RDNA 4)', year: 2025, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 4', tier: 'A', price: 549, vram: '16GB GDDR6', tdp: 220, score: 87, fans: 3, form: 'triple', pcie: 'PCIe 5.0', lengthMm: 275, color: 0x18181b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx9070xt', name: 'AMD Radeon RX 9070 XT 16GB (Next-Gen RT)', year: 2025, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 4', tier: 'S', price: 649, vram: '16GB GDDR6', tdp: 260, score: 96, fans: 3, form: 'triple', pcie: 'PCIe 5.0', lengthMm: 285, color: 0x09090b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_rx9070xtx', name: 'AMD Radeon RX 9070 XTX 24GB (RDNA 4 Apex)', year: 2025, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'RDNA 4', tier: 'S', price: 849, vram: '24GB GDDR6', tdp: 320, score: 106, fans: 3, form: 'massive', pcie: 'PCIe 5.0', lengthMm: 300, color: 0x09090b, accentColor: 0xef4444, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_amd_mi300x', name: 'AMD Instinct MI300X 192GB HBM3 (AI Cluster)', year: 2024, brand: 'AMD', era: 'rdna_2019_2026', architecture: 'CDNA 3', tier: 'S', price: 12000, vram: '192GB HBM3 (5.3TB/s)', tdp: 750, score: 135, fans: 0, form: 'massive', pcie: 'PCIe 5.0', lengthMm: 340, color: 0x1e1b4b, accentColor: 0xa855f7, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // =========================================================================
    // 1. ERA NVIDIA: SHADERS FIJOS Y PRIMEROS PASOS (2000 – 2006)
    // =========================================================================
    // Celsius: GeForce 2 (2000)
    { id: 'g_nv_256ddr', name: 'NVIDIA GeForce 256 DDR (Primer GPU)', year: 2000, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV10 (Celsius)', tier: 'D', price: 15, vram: '32MB DDR', tdp: 20, score: 2, fans: 1, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 175, color: 0x166534, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gf2mx', name: 'NVIDIA GeForce 2 MX 400', year: 2000, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV11 (Celsius)', tier: 'D', price: 12, vram: '32MB SDR', tdp: 8, score: 2, fans: 0, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 160, color: 0x14532d, accentColor: 0x16a34a, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gf2gts', name: 'NVIDIA GeForce 2 GTS / Pro', year: 2000, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV15 (Celsius)', tier: 'D', price: 18, vram: '32MB DDR', tdp: 12, score: 3, fans: 1, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 170, color: 0x166534, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gf2ultra', name: 'NVIDIA GeForce 2 Ultra', year: 2000, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV15 (Celsius)', tier: 'D', price: 22, vram: '64MB DDR', tdp: 14, score: 3, fans: 1, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 180, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Kelvin: GeForce 3 (2001) - Primeros sombreadores programables
    { id: 'g_nv_gf3ti200', name: 'NVIDIA GeForce 3 Ti 200', year: 2001, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV20 (Kelvin)', tier: 'D', price: 20, vram: '64MB DDR', tdp: 16, score: 4, fans: 1, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 175, color: 0x166534, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gf3ti500', name: 'NVIDIA GeForce 3 Ti 500 (DX8.0)', year: 2001, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV20 (Kelvin)', tier: 'D', price: 28, vram: '64MB DDR', tdp: 22, score: 4, fans: 1, form: 'retro-tiny', pcie: 'AGP 4X', lengthMm: 185, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Kelvin: GeForce 4 (2002)
    { id: 'g_nv_gf4mx440', name: 'NVIDIA GeForce 4 MX 440 (Ultra Popular)', year: 2002, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV17 (Celsius mod)', tier: 'D', price: 16, vram: '64MB DDR', tdp: 15, score: 3, fans: 1, form: 'retro-tiny', pcie: 'AGP 8X', lengthMm: 165, color: 0x14532d, accentColor: 0x16a34a, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gf4ti4200', name: 'NVIDIA GeForce 4 Ti 4200 (Leyenda Precio/Rend)', year: 2002, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV25 (Kelvin)', tier: 'D', price: 25, vram: '128MB DDR', tdp: 28, score: 5, fans: 1, form: 'retro-tiny', pcie: 'AGP 8X', lengthMm: 185, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gf4ti4600', name: 'NVIDIA GeForce 4 Ti 4600 (Kelvin Flagship)', year: 2002, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV25 (Kelvin)', tier: 'D', price: 32, vram: '128MB DDR', tdp: 35, score: 5, fans: 1, form: 'retro-single', pcie: 'AGP 4X', lengthMm: 200, color: 0x166534, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Rankine: GeForce FX / 5000 (2003)
    { id: 'g_nv_fx5200', name: 'NVIDIA GeForce FX 5200 (Superventas)', year: 2003, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV34 (Rankine)', tier: 'D', price: 15, vram: '128MB DDR', tdp: 20, score: 3, fans: 0, form: 'retro-tiny', pcie: 'AGP 8X', lengthMm: 165, color: 0x1e3a8a, accentColor: 0x3b82f6, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_fx5700u', name: 'NVIDIA GeForce FX 5700 Ultra', year: 2003, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV36 (Rankine)', tier: 'D', price: 26, vram: '128MB GDDR2', tdp: 46, score: 5, fans: 1, form: 'retro-single', pcie: 'AGP 8X', lengthMm: 190, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_fx5800u', name: 'NVIDIA GeForce FX 5800 Ultra (Mítico FlowFX)', year: 2003, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV30 (Rankine)', tier: 'D', price: 42, vram: '128MB DDR2', tdp: 59, score: 6, fans: 1, form: 'blower', pcie: 'AGP 8X', lengthMm: 215, color: 0x0f172a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_fx5950u', name: 'NVIDIA GeForce FX 5950 Ultra', year: 2003, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV38 (Rankine)', tier: 'D', price: 38, vram: '256MB DDR', tdp: 73, score: 6, fans: 1, form: 'retro-single', pcie: 'AGP 8X', lengthMm: 220, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Curie: GeForce 6 (2004) - Shader Model 3.0 & SLI Debut
    { id: 'g_nv_6600gt', name: 'NVIDIA GeForce 6600 GT (Icono Indiscutible)', year: 2004, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV43 (Curie)', tier: 'D', price: 30, vram: '128MB GDDR3', tdp: 48, score: 8, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 185, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_6800gt', name: 'NVIDIA GeForce 6800 GT', year: 2004, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV40 (Curie)', tier: 'D', price: 42, vram: '256MB GDDR3', tdp: 67, score: 9, fans: 1, form: 'retro-single', pcie: 'AGP / PCIe', lengthMm: 215, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_6800ultra', name: 'NVIDIA GeForce 6800 Ultra (Doble Molex SLI)', year: 2004, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'NV40 (Curie)', tier: 'D', price: 55, vram: '256MB GDDR3', tdp: 80, score: 10, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 225, color: 0x0f172a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Curie: GeForce 7 (2005 – 2006)
    { id: 'g_nv_7600gt', name: 'NVIDIA GeForce 7600 GT 256MB', year: 2006, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'G73 (Curie)', tier: 'D', price: 28, vram: '256MB GDDR3', tdp: 36, score: 9, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 180, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_7800gtx', name: 'NVIDIA GeForce 7800 GTX 256MB', year: 2005, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'G70 (Curie)', tier: 'D', price: 40, vram: '256MB GDDR3', tdp: 86, score: 11, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 228, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_7900gt', name: 'NVIDIA GeForce 7900 GT 256MB', year: 2006, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'G71 (Curie)', tier: 'D', price: 38, vram: '256MB GDDR3', tdp: 48, score: 11, fans: 1, form: 'retro-single', pcie: 'PCIe 1.0', lengthMm: 200, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_7950gx2', name: 'NVIDIA GeForce 7950 GX2 (Sandwich Dual-PCB)', year: 2006, brand: 'NVIDIA', era: 'era_2000_2006', architecture: 'G71 Dual (Curie)', tier: 'D', price: 65, vram: '1GB (2x512MB)', tdp: 110, score: 14, fans: 2, form: 'dual-gpu', pcie: 'PCIe 1.0', lengthMm: 240, color: 0x09090b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // =========================================================================
    // 2. ERA NVIDIA: ARQUITECTURA UNIFICADA Y CUDA (2006 – 2014)
    // =========================================================================
    // Tesla: GeForce 8 (2006) - El hito G80 de DirectX 10
    { id: 'g_nv_8400gs', name: 'NVIDIA GeForce 8400 GS', year: 2007, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G86 (Tesla 1.0)', tier: 'D', price: 15, vram: '512MB DDR2', tdp: 25, score: 5, fans: 0, form: 'retro-tiny', pcie: 'PCIe 1.1', lengthMm: 165, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_8600gt', name: 'NVIDIA GeForce 8600 GT', year: 2007, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G84 (Tesla 1.0)', tier: 'D', price: 25, vram: '256MB GDDR3', tdp: 47, score: 9, fans: 1, form: 'retro-single', pcie: 'PCIe 1.1', lengthMm: 180, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_8800gts', name: 'NVIDIA GeForce 8800 GTS 640MB', year: 2006, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G80 (Tesla 1.0)', tier: 'D', price: 38, vram: '640MB GDDR3', tdp: 140, score: 13, fans: 1, form: 'blower', pcie: 'PCIe 1.0', lengthMm: 230, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_8800gtx', name: 'NVIDIA GeForce 8800 GTX (Leyenda Crysis)', year: 2006, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G80 (Tesla 1.0)', tier: 'D', price: 50, vram: '768MB GDDR3 384-bit', tdp: 155, score: 15, fans: 1, form: 'blower', pcie: 'PCIe 1.0', lengthMm: 280, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_8800ultra', name: 'NVIDIA GeForce 8800 Ultra (G80 Apex)', year: 2007, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G80 (Tesla 1.0)', tier: 'D', price: 65, vram: '768MB GDDR3', tdp: 175, score: 17, fans: 1, form: 'blower', pcie: 'PCIe 1.0', lengthMm: 280, color: 0x09090b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Tesla: GeForce 9 y 200 (2008 – 2009)
    { id: 'g_nv_9600gt', name: 'NVIDIA GeForce 9600 GT 512MB', year: 2008, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G94 (Tesla 1.5)', tier: 'D', price: 30, vram: '512MB GDDR3', tdp: 95, score: 14, fans: 1, form: 'retro-single', pcie: 'PCIe 2.0', lengthMm: 215, color: 0x15803d, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_9800gtx', name: 'NVIDIA GeForce 9800 GTX+ 512MB', year: 2008, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G92b (Tesla 1.5)', tier: 'D', price: 38, vram: '512MB GDDR3', tdp: 141, score: 18, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 267, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_9800gx2', name: 'NVIDIA GeForce 9800 GX2 (Dual-GPU Clamshell)', year: 2008, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'G92 Dual (Tesla)', tier: 'D', price: 58, vram: '1GB (2x512MB)', tdp: 197, score: 22, fans: 1, form: 'dual-gpu', pcie: 'PCIe 2.0', lengthMm: 270, color: 0x09090b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx260', name: 'NVIDIA GeForce GTX 260 216SP', year: 2008, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GT200b (Tesla 2.0)', tier: 'D', price: 35, vram: '896MB GDDR3 448-bit', tdp: 171, score: 20, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 267, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx280', name: 'NVIDIA GeForce GTX 280 1GB 512-bit', year: 2008, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GT200 (Tesla 2.0)', tier: 'D', price: 45, vram: '1GB GDDR3 512-bit', tdp: 236, score: 24, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 267, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx285', name: 'NVIDIA GeForce GTX 285', year: 2009, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GT200b (Tesla 2.0)', tier: 'D', price: 50, vram: '1GB GDDR3 512-bit', tdp: 204, score: 26, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 267, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx295', name: 'NVIDIA GeForce GTX 295 (Dual-GT200b)', year: 2009, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GT200b Dual', tier: 'D', price: 75, vram: '1792MB GDDR3', tdp: 289, score: 33, fans: 1, form: 'dual-gpu', pcie: 'PCIe 2.0', lengthMm: 267, color: 0x09090b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Fermi: GeForce 400 y 500 (2010 – 2011)
    { id: 'g_nv_gtx460', name: 'NVIDIA GeForce GTX 460 1GB (Overclock King)', year: 2010, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GF104 (Fermi)', tier: 'D', price: 38, vram: '1GB GDDR5', tdp: 160, score: 23, fans: 1, form: 'retro-single', pcie: 'PCIe 2.0', lengthMm: 210, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx470', name: 'NVIDIA GeForce GTX 470 1.25GB', year: 2010, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GF100 (Fermi)', tier: 'D', price: 42, vram: '1280MB GDDR5', tdp: 215, score: 26, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 241, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx480', name: 'NVIDIA GeForce GTX 480 ("Thermi" Grill)', year: 2010, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GF100 (Fermi)', tier: 'D', price: 55, vram: '1.5GB GDDR5', tdp: 250, score: 30, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 267, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx560ti', name: 'NVIDIA GeForce GTX 560 Ti', year: 2011, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GF114 (Fermi)', tier: 'D', price: 45, vram: '1GB GDDR5', tdp: 170, score: 28, fans: 1, form: 'retro-single', pcie: 'PCIe 2.0', lengthMm: 228, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx580', name: 'NVIDIA GeForce GTX 580 (Fermi Perfeccionado)', year: 2010, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GF110 (Fermi)', tier: 'D', price: 65, vram: '1.5GB GDDR5', tdp: 244, score: 35, fans: 1, form: 'blower', pcie: 'PCIe 2.0', lengthMm: 267, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx590', name: 'NVIDIA GeForce GTX 590 (Dual-GF110 Monster)', year: 2011, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GF110 Dual', tier: 'C', price: 95, vram: '3GB (2x1.5GB)', tdp: 365, score: 44, fans: 1, form: 'dual-gpu', pcie: 'PCIe 2.0', lengthMm: 280, color: 0x09090b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Kepler: GeForce 600 y 700 / Original TITAN (2012 – 2014)
    { id: 'g_nv_gtx660ti', name: 'NVIDIA GeForce GTX 660 Ti 2GB', year: 2012, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GK106 (Kepler)', tier: 'D', price: 48, vram: '2GB GDDR5', tdp: 150, score: 33, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 241, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx680', name: 'NVIDIA GeForce GTX 680 (Kepler Debut)', year: 2012, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GK104 (Kepler)', tier: 'C', price: 65, vram: '2GB GDDR5', tdp: 195, score: 39, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 254, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx690', name: 'NVIDIA GeForce GTX 690 (Magnesio Dual GK104)', year: 2012, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GK104 Dual', tier: 'C', price: 120, vram: '4GB (2x2GB)', tdp: 300, score: 50, fans: 1, form: 'dual-gpu', pcie: 'PCIe 3.0', lengthMm: 280, color: 0x71717a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx750ti', name: 'NVIDIA GeForce GTX 750 Ti (Maxwell 60W)', year: 2014, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GM107 (Maxwell 1)', tier: 'D', price: 45, vram: '2GB GDDR5', tdp: 60, score: 28, fans: 1, form: 'retro-tiny', pcie: 'PCIe 3.0', lengthMm: 170, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx770', name: 'NVIDIA GeForce GTX 770 2GB', year: 2013, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GK104-425', tier: 'C', price: 60, vram: '2GB GDDR5', tdp: 230, score: 41, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x52525b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx780ti', name: 'NVIDIA GeForce GTX 780 Ti (Full GK110)', year: 2013, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GK110-425', tier: 'C', price: 85, vram: '3GB GDDR5 384-bit', tdp: 250, score: 49, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x71717a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtxtitan', name: 'NVIDIA GeForce GTX TITAN 6GB (Icono NVTTM)', year: 2013, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GK110 (Kepler)', tier: 'B', price: 120, vram: '6GB GDDR5', tdp: 250, score: 50, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x71717a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_titanz', name: 'NVIDIA GeForce GTX TITAN Z (Dual GK110)', year: 2014, brand: 'NVIDIA', era: 'era_2006_2014', architecture: 'GK110 Dual', tier: 'B', price: 280, vram: '12GB (2x6GB)', tdp: 375, score: 62, fans: 1, form: 'massive', pcie: 'PCIe 3.0', lengthMm: 280, color: 0x3f3f46, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // =========================================================================
    // 3. ERA NVIDIA: EFICIENCIA ABSOLUTA Y MADUREZ GTX (2014 – 2018)
    // =========================================================================
    // Maxwell 2.0: GeForce 900 (2014 – 2015)
    { id: 'g_nv_gtx960', name: 'NVIDIA GeForce GTX 960 4GB', year: 2015, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GM206 (Maxwell 2)', tier: 'D', price: 65, vram: '4GB GDDR5', tdp: 120, score: 36, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 241, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx970', name: 'NVIDIA GeForce GTX 970 (3.5GB + 0.5GB Rey)', year: 2014, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GM204 (Maxwell 2)', tier: 'C', price: 80, vram: '4GB GDDR5', tdp: 145, score: 43, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 241, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx980', name: 'NVIDIA GeForce GTX 980 4GB', year: 2014, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GM204 (Maxwell 2)', tier: 'C', price: 95, vram: '4GB GDDR5', tdp: 165, score: 48, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x71717a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx980ti', name: 'NVIDIA GeForce GTX 980 Ti 6GB', year: 2015, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GM200 (Maxwell 2)', tier: 'B', price: 130, vram: '6GB GDDR5 384-bit', tdp: 250, score: 55, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x71717a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_titanx_m', name: 'NVIDIA GeForce GTX TITAN X (Maxwell 12GB)', year: 2015, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GM200 (Maxwell 2)', tier: 'B', price: 160, vram: '12GB GDDR5', tdp: 250, score: 57, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Pascal: GeForce 10 (2016 – 2017) - Revolución de 16nm
    { id: 'g_nv_gt1030', name: 'NVIDIA GeForce GT 1030 2GB GDDR5', year: 2017, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP108 (Pascal)', tier: 'D', price: 40, vram: '2GB GDDR5', tdp: 30, score: 20, fans: 0, form: 'retro-tiny', pcie: 'PCIe 3.0', lengthMm: 150, color: 0x1e293b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx1050ti', name: 'NVIDIA GeForce GTX 1050 Ti 4GB', year: 2016, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP107 (Pascal)', tier: 'D', price: 65, vram: '4GB GDDR5', tdp: 75, score: 33, fans: 1, form: 'retro-single', pcie: 'PCIe 3.0', lengthMm: 190, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx1060_6g', name: 'NVIDIA GeForce GTX 1060 6GB (Reina de Steam)', year: 2016, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP106 (Pascal)', tier: 'C', price: 95, vram: '6GB GDDR5', tdp: 120, score: 44, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 242, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx1070', name: 'NVIDIA GeForce GTX 1070 8GB', year: 2016, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP104 (Pascal)', tier: 'C', price: 120, vram: '8GB GDDR5', tdp: 150, score: 51, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x71717a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx1070ti', name: 'NVIDIA GeForce GTX 1070 Ti 8GB', year: 2017, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP104 (Pascal)', tier: 'B', price: 140, vram: '8GB GDDR5', tdp: 180, score: 56, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x334155, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx1080', name: 'NVIDIA GeForce GTX 1080 8GB GDDR5X', year: 2016, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP104 (Pascal)', tier: 'B', price: 170, vram: '8GB GDDR5X', tdp: 180, score: 60, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x71717a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_1080ti', name: 'NVIDIA GeForce GTX 1080 Ti (Santo Grial Pascal)', year: 2017, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP102 (Pascal)', tier: 'A', price: 280, vram: '11GB GDDR5X 352-bit', tdp: 250, score: 70, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x94a3b8, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_titanxp', name: 'NVIDIA TITAN Xp 12GB (Full GP102)', year: 2017, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GP102 (Pascal)', tier: 'A', price: 340, vram: '12GB GDDR5X', tdp: 250, score: 72, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x09090b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_titanv', name: 'NVIDIA TITAN V (Volta 12GB HBM2 Dorada)', year: 2017, brand: 'NVIDIA', era: 'era_2014_2018', architecture: 'GV100 (Volta)', tier: 'A', price: 550, vram: '12GB HBM2', tdp: 250, score: 76, fans: 1, form: 'blower', pcie: 'PCIe 3.0', lengthMm: 267, color: 0xd97706, accentColor: 0xf59e0b, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // =========================================================================
    // 4. ERA NVIDIA: RAY TRACING (RTX) E INTELIGENCIA ARTIFICIAL (2018 – 2026)
    // =========================================================================
    // Turing: GeForce GTX 16 & RTX 20 (2018 – 2019)
    { id: 'g_nv_gtx1650', name: 'NVIDIA GeForce GTX 1650 4GB', year: 2019, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU117 (Turing)', tier: 'D', price: 85, vram: '4GB GDDR6', tdp: 75, score: 35, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 200, color: 0x18181b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_gtx1660s', name: 'NVIDIA GeForce GTX 1660 SUPER 6GB', year: 2019, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU116 (Turing)', tier: 'C', price: 110, vram: '6GB GDDR6', tdp: 125, score: 44, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 220, color: 0x27272a, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx2060', name: 'NVIDIA GeForce RTX 2060 6GB (Puerta al RT)', year: 2019, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU106 (Turing)', tier: 'C', price: 150, vram: '6GB GDDR6', tdp: 160, score: 52, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 228, color: 0x334155, accentColor: 0x10b981, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx2060s', name: 'NVIDIA GeForce RTX 2060 SUPER 8GB', year: 2019, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU106 (Turing)', tier: 'C', price: 180, vram: '8GB GDDR6', tdp: 175, score: 57, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 228, color: 0x334155, accentColor: 0x10b981, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx2070s', name: 'NVIDIA GeForce RTX 2070 SUPER 8GB', year: 2019, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU104 (Turing)', tier: 'B', price: 230, vram: '8GB GDDR6', tdp: 215, score: 62, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x475569, accentColor: 0x10b981, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx2080s', name: 'NVIDIA GeForce RTX 2080 SUPER 8GB', year: 2019, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU104 (Turing)', tier: 'B', price: 290, vram: '8GB GDDR6', tdp: 250, score: 67, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x475569, accentColor: 0x10b981, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_2080ti', name: 'NVIDIA GeForce RTX 2080 Ti 11GB', year: 2018, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU102 (Turing)', tier: 'B', price: 340, vram: '11GB GDDR6 352-bit', tdp: 260, score: 71, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 267, color: 0x475569, accentColor: 0x10b981, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_titanrtx', name: 'NVIDIA TITAN RTX 24GB ("T-Rex" Dorado)', year: 2018, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'TU102 full', tier: 'A', price: 650, vram: '24GB GDDR6', tdp: 280, score: 75, fans: 2, form: 'dual', pcie: 'PCIe 3.0', lengthMm: 267, color: 0xd97706, accentColor: 0xf59e0b, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Ampere: GeForce RTX 30 (2020 – 2022) - Diseño Flow-Through y GDDR6X
    { id: 'g_3050', name: 'NVIDIA GeForce RTX 3050 8GB', year: 2022, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA106 (Ampere)', tier: 'D', price: 219, vram: '8GB GDDR6', tdp: 130, score: 38, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 200, color: 0x1e293b, accentColor: 0x64748b, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_3060', name: 'NVIDIA GeForce RTX 3060 12GB', year: 2021, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA106 (Ampere)', tier: 'C', price: 279, vram: '12GB GDDR6', tdp: 170, score: 50, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 242, color: 0x334155, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx3060ti', name: 'NVIDIA GeForce RTX 3060 Ti 8GB', year: 2020, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA104 (Ampere)', tier: 'B', price: 320, vram: '8GB GDDR6', tdp: 200, score: 62, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 242, color: 0x334155, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx3070', name: 'NVIDIA GeForce RTX 3070 8GB', year: 2020, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA104 (Ampere)', tier: 'B', price: 350, vram: '8GB GDDR6', tdp: 220, score: 68, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 242, color: 0x334155, accentColor: 0x38bdf8, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx3070ti', name: 'NVIDIA GeForce RTX 3070 Ti 8GB', year: 2021, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA104 (Ampere)', tier: 'B', price: 390, vram: '8GB GDDR6X', tdp: 290, score: 71, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 267, color: 0x334155, accentColor: 0x38bdf8, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx3080', name: 'NVIDIA GeForce RTX 3080 10GB (Flow-Through)', year: 2020, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA102 (Ampere)', tier: 'A', price: 470, vram: '10GB GDDR6X 320-bit', tdp: 320, score: 78, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 285, color: 0x1e293b, accentColor: 0x38bdf8, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_3080ti', name: 'NVIDIA GeForce RTX 3080 Ti 12GB', year: 2021, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA102 (Ampere)', tier: 'A', price: 580, vram: '12GB GDDR6X', tdp: 350, score: 82, fans: 3, form: 'triple', pcie: 'PCIe 4.0', lengthMm: 300, color: 0x334155, accentColor: 0x38bdf8, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx3090', name: 'NVIDIA GeForce RTX 3090 24GB (BFGPU)', year: 2020, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA102 (Ampere)', tier: 'S', price: 780, vram: '24GB GDDR6X', tdp: 350, score: 85, fans: 3, form: 'massive', pcie: 'PCIe 4.0', lengthMm: 313, color: 0x0f172a, accentColor: 0x38bdf8, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx3090ti', name: 'NVIDIA GeForce RTX 3090 Ti 24GB (450W Beast)', year: 2022, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GA102 full', tier: 'S', price: 890, vram: '24GB GDDR6X', tdp: 450, score: 90, fans: 3, form: 'massive', pcie: 'PCIe 4.0', lengthMm: 313, color: 0x09090b, accentColor: 0x38bdf8, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Ada Lovelace: GeForce RTX 40 (2022 – 2024) - DLSS 3 Frame Gen
    { id: 'g_4060', name: 'NVIDIA GeForce RTX 4060 8GB', year: 2023, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'AD107 (Ada)', tier: 'C', price: 299, vram: '8GB GDDR6', tdp: 115, score: 54, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 210, color: 0x0f172a, accentColor: 0x06b6d4, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_4060ti', name: 'NVIDIA GeForce RTX 4060 Ti 16GB', year: 2023, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'AD106 (Ada)', tier: 'B', price: 449, vram: '16GB GDDR6', tdp: 165, score: 66, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 230, color: 0x1e293b, accentColor: 0x3b82f6, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_4070s', name: 'NVIDIA GeForce RTX 4070 SUPER 12GB', year: 2024, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'AD104 (Ada)', tier: 'A', price: 599, vram: '12GB GDDR6X', tdp: 220, score: 82, fans: 2, form: 'dual', pcie: 'PCIe 4.0', lengthMm: 242, color: 0x0f172a, accentColor: 0x10b981, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_4070ts', name: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', year: 2024, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'AD103 (Ada)', tier: 'A', price: 799, vram: '16GB GDDR6X 256-bit', tdp: 285, score: 86, fans: 3, form: 'triple', pcie: 'PCIe 4.0', lengthMm: 285, color: 0x1e293b, accentColor: 0x06b6d4, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_4080s', name: 'NVIDIA GeForce RTX 4080 SUPER 16GB', year: 2024, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'AD103 full (Ada)', tier: 'S', price: 999, vram: '16GB GDDR6X', tdp: 320, score: 92, fans: 3, form: 'massive', pcie: 'PCIe 4.0', lengthMm: 300, color: 0x111827, accentColor: 0x06b6d4, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_4090', name: 'NVIDIA GeForce RTX 4090 24GB (Reina Path Tracing)', year: 2022, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'AD102 (Ada)', tier: 'S', price: 1599, vram: '24GB GDDR6X', tdp: 450, score: 105, fans: 3, form: 'massive', pcie: 'PCIe 4.0', lengthMm: 304, color: 0x1c1e24, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },

    // Blackwell: GeForce RTX 50 (2025) & Rubin Enterprise (2026)
    { id: 'g_nv_rtx5060', name: 'NVIDIA GeForce RTX 5060 12GB GDDR7', year: 2025, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GB206 (Blackwell)', tier: 'B', price: 349, vram: '12GB GDDR7', tdp: 140, score: 72, fans: 2, form: 'dual', pcie: 'PCIe 5.0', lengthMm: 235, color: 0x09090b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx5070', name: 'NVIDIA GeForce RTX 5070 12GB GDDR7', year: 2025, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GB205 (Blackwell)', tier: 'A', price: 599, vram: '12GB GDDR7', tdp: 220, score: 88, fans: 2, form: 'dual', pcie: 'PCIe 5.0', lengthMm: 250, color: 0x111111, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx5070ti', name: 'NVIDIA GeForce RTX 5070 Ti 16GB GDDR7', year: 2025, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GB203 (Blackwell)', tier: 'A', price: 749, vram: '16GB GDDR7', tdp: 275, score: 96, fans: 3, form: 'triple', pcie: 'PCIe 5.0', lengthMm: 285, color: 0x111111, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_rtx5080', name: 'NVIDIA GeForce RTX 5080 16GB GDDR7 (30 Gbps)', year: 2025, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GB203 full (Blackwell)', tier: 'S', price: 1099, vram: '16GB GDDR7 (30Gbps)', tdp: 360, score: 110, fans: 3, form: 'massive', pcie: 'PCIe 5.0', lengthMm: 310, color: 0x0a0a0a, accentColor: 0x00ff66, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_5090', name: 'NVIDIA GeForce RTX 5090 32GB (Blackwell Apex)', year: 2025, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'GB202 (Blackwell)', tier: 'S', price: 1999, vram: '32GB GDDR7 512-bit', tdp: 575, score: 138, fans: 3, form: 'massive', pcie: 'PCIe 5.0', lengthMm: 340, color: 0x09090b, accentColor: 0x00ff66, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' },
    { id: 'g_nv_b200', name: 'NVIDIA B200 / GB300 Vera Rubin (AI Supercluster)', year: 2026, brand: 'NVIDIA', era: 'era_2018_2026', architecture: 'Blackwell / Rubin (Data Center)', tier: 'S', price: 35000, vram: '192GB HBM3e (8TB/s)', tdp: 1000, score: 160, fans: 0, form: 'massive', pcie: 'PCIe 5.0 / SXM', lengthMm: 350, color: 0x1e1b4b, accentColor: 0x22c55e, img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300' }
  ],

  cpu: [
    // TOP TIER (Tier S)
    { id: 'c_9800x3d', name: 'AMD Ryzen 7 9800X3D', year: 2024, brand: 'AMD', tier: 'S', price: 479, socket: 'AM5', ramGen: 'DDR5', cores: 8, threads: 16, tdp: 120, score: 105, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    { id: 'c_7800x3d', name: 'AMD Ryzen 7 7800X3D', year: 2023, brand: 'AMD', tier: 'S', price: 399, socket: 'AM5', ramGen: 'DDR5', cores: 8, threads: 16, tdp: 120, score: 100, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    { id: 'c_14900k', name: 'Intel Core i9-14900K', year: 2023, brand: 'Intel', tier: 'S', price: 549, socket: 'LGA1700', ramGen: 'DDR5', cores: 24, threads: 32, tdp: 253, score: 98, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    
    // GOOD TIER (Tier A)
    { id: 'c_13600k', name: 'Intel Core i5-13600K', year: 2022, brand: 'Intel', tier: 'A', price: 289, socket: 'LGA1700', ramGen: 'DDR5', cores: 14, threads: 20, tdp: 181, score: 85, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    { id: 'c_7600x', name: 'AMD Ryzen 5 7600X', year: 2022, brand: 'AMD', tier: 'A', price: 219, socket: 'AM5', ramGen: 'DDR5', cores: 6, threads: 12, tdp: 105, score: 80, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    { id: 'c_5800x3d', name: 'AMD Ryzen 7 5800X3D', year: 2022, brand: 'AMD', tier: 'A', price: 320, socket: 'AM4', ramGen: 'DDR4', cores: 8, threads: 16, tdp: 105, score: 82, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },

    // NORMAL TIER (Tier B)
    { id: 'c_5600x', name: 'AMD Ryzen 5 5600X', year: 2020, brand: 'AMD', tier: 'B', price: 139, socket: 'AM4', ramGen: 'DDR4', cores: 6, threads: 12, tdp: 65, score: 64, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    { id: 'c_12400f', name: 'Intel Core i5-12400F', year: 2022, brand: 'Intel', tier: 'B', price: 129, socket: 'LGA1700', ramGen: 'DDR4', cores: 6, threads: 12, tdp: 65, score: 62, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },

    // RETRO & NOT BUY (Tier C/D)
    { id: 'c_2600k', name: 'Intel Core i7-2600K (Sandy Bridge King)', year: 2011, brand: 'Intel', tier: 'D', price: 40, socket: 'LGA1155', ramGen: 'DDR3', cores: 4, threads: 8, tdp: 95, score: 28, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    { id: 'c_q6600', name: 'Intel Core 2 Quad Q6600 (Crysis Age)', year: 2007, brand: 'Intel', tier: 'D', price: 15, socket: 'LGA775', ramGen: 'DDR2', cores: 4, threads: 4, tdp: 105, score: 14, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' },
    { id: 'c_athlon64', name: 'AMD Athlon 64 3500+ (2004 Legend)', year: 2004, brand: 'AMD', tier: 'D', price: 10, socket: 'Socket 939', ramGen: 'DDR1', cores: 1, threads: 1, tdp: 67, score: 6, img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=300' }
  ],

  motherboard: [
    { id: 'mb_z790', name: 'ASUS ROG MAXIMUS Z790 HERO', tier: 'S', price: 580, socket: 'LGA1700', ramGen: 'DDR5', format: 'ATX', m2Slots: 5, pcieVer: 'PCIe 5.0' },
    { id: 'mb_x670e', name: 'MSI MAG X670E TOMAHAWK WIFI', tier: 'S', price: 299, socket: 'AM5', ramGen: 'DDR5', format: 'ATX', m2Slots: 4, pcieVer: 'PCIe 5.0' },
    { id: 'mb_b650', name: 'Gigabyte B650 AORUS ELITE AX', tier: 'A', price: 199, socket: 'AM5', ramGen: 'DDR5', format: 'ATX', m2Slots: 3, pcieVer: 'PCIe 4.0' },
    { id: 'mb_b550', name: 'ASUS TUF GAMING B550-PLUS', tier: 'B', price: 140, socket: 'AM4', ramGen: 'DDR4', format: 'ATX', m2Slots: 2, pcieVer: 'PCIe 4.0' },
    { id: 'mb_retro775', name: 'ASUS P5K Deluxe WiFi-AP (Retro 2007)', tier: 'D', price: 30, socket: 'LGA775', ramGen: 'DDR2', format: 'ATX', m2Slots: 0, pcieVer: 'PCIe 1.1' }
  ],

  ram: [
    { id: 'r_ddr5_64', name: 'G.Skill Trident Z5 RGB 64GB (2x32) DDR5-6400 CL32', tier: 'S', price: 240, gen: 'DDR5', capacity: '64GB', mhz: 6400 },
    { id: 'r_ddr5_32', name: 'Corsair Vengeance RGB 32GB (2x16) DDR5-6000 CL30', tier: 'A', price: 115, gen: 'DDR5', capacity: '32GB', mhz: 6000 },
    { id: 'r_ddr4_32', name: 'Kingston Fury Beast 32GB (2x16) DDR4-3600 CL16', tier: 'B', price: 75, gen: 'DDR4', capacity: '32GB', mhz: 3600 },
    { id: 'r_ddr4_16', name: 'Corsair Vengeance LPX 16GB (2x8) DDR4-3200 CL16', tier: 'C', price: 42, gen: 'DDR4', capacity: '16GB', mhz: 3200 },
    { id: 'r_ddr2_4', name: 'Kingston HyperX 4GB (2x2) DDR2-800 Retro', tier: 'D', price: 12, gen: 'DDR2', capacity: '4GB', mhz: 800 }
  ],

  cooler: [
    { id: 'cl_aio360', name: 'Lian Li Galahad II LCD 360 ARGB (Líquida AIO)', tier: 'S', price: 230, tdpMax: 320, type: 'liquid', fanRpm: 2400, noiseDb: 30 },
    { id: 'cl_nhd15', name: 'Noctua NH-D15 Chromax.Black (Doble Torre Aire)', tier: 'A', price: 119, tdpMax: 260, type: 'air', fanRpm: 1500, noiseDb: 24 },
    { id: 'cl_ak620', name: 'DeepCool AK620 Digital', tier: 'B', price: 69, tdpMax: 240, type: 'air', fanRpm: 1850, noiseDb: 28 },
    { id: 'cl_ag400', name: 'DeepCool AG400 ARGB', tier: 'C', price: 28, tdpMax: 180, type: 'air', fanRpm: 2000, noiseDb: 31 },
    { id: 'cl_stock', name: 'Disipador Stock Intel/AMD Box', tier: 'D', price: 0, tdpMax: 75, type: 'stock', fanRpm: 2800, noiseDb: 40 }
  ],

  storage: [
    { id: 'st_gen5', name: 'Crucial T700 2TB PCIe 5.0 NVMe (12,400 MB/s)', tier: 'S', price: 289, type: 'NVMe Gen5', capacity: '2TB', speedMb: 12400 },
    { id: 'st_gen4_2t', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', tier: 'A', price: 179, type: 'NVMe Gen4', capacity: '2TB', speedMb: 7450 },
    { id: 'st_gen4_1t', name: 'WD_BLACK SN770 1TB PCIe 4.0 NVMe', tier: 'B', price: 85, type: 'NVMe Gen4', capacity: '1TB', speedMb: 5150 },
    { id: 'st_sata', name: 'Crucial BX500 1TB 2.5" SATA SSD', tier: 'C', price: 58, type: 'SATA SSD', capacity: '1TB', speedMb: 540 },
    { id: 'st_hdd', name: 'Seagate Barracuda 2TB 7200RPM HDD Mecánico', tier: 'D', price: 49, type: 'HDD', capacity: '2TB', speedMb: 180 }
  ],

  case: [
    { id: 'cs_o11', name: 'Lian Li O11 Vision Dual Chamber Glass', tier: 'S', price: 149, maxGpuLen: 455, maxCoolerHeight: 167, airflowScore: 92 },
    { id: 'cs_h7flow', name: 'NZXT H7 Flow High Airflow ATX Mid-Tower', tier: 'A', price: 129, maxGpuLen: 400, maxCoolerHeight: 185, airflowScore: 88 },
    { id: 'cs_4000d', name: 'Corsair 4000D Airflow Tempered Glass', tier: 'B', price: 89, maxGpuLen: 360, maxCoolerHeight: 170, airflowScore: 80 },
    { id: 'cs_retro', name: 'Gabinete Clásico Beige ATX (Años 2000)', tier: 'D', price: 20, maxGpuLen: 280, maxCoolerHeight: 140, airflowScore: 35 }
  ],

  psu: [
    { id: 'ps_1200', name: 'Corsair RM1200x SHIFT ATX 3.0 PCIe 5.0 (80+ Gold)', tier: 'S', price: 220, wattage: 1200, rating: '80+ Gold', pcie12v: true },
    { id: 'ps_1000', name: 'Seasonic Focus GX-1000 ATX 3.0', tier: 'S', price: 179, wattage: 1000, rating: '80+ Gold', pcie12v: true },
    { id: 'ps_850', name: 'MSI MAG A850GL PCIE5 850W (80+ Gold)', tier: 'A', price: 119, wattage: 850, rating: '80+ Gold', pcie12v: true },
    { id: 'ps_650', name: 'Cooler Master MWE 650 V2 (80+ Bronze)', tier: 'B', price: 65, wattage: 650, rating: '80+ Bronze', pcie12v: false },
    { id: 'ps_500', name: 'EVGA 500 W1 (80+ White Entrada)', tier: 'C', price: 45, wattage: 500, rating: '80+ White', pcie12v: false },
    { id: 'ps_300', name: 'Fuente Genérica 300W Gris (Retro)', tier: 'D', price: 15, wattage: 300, rating: 'Genérica', pcie12v: false }
  ]
};

const eraCategories = [
  { id: 'ALL_ERAS', label: 'Todas las Eras (2000-2026)' },
  { id: 'era_2000_2006', label: '1. Shaders Fijos & Celsius/R300 (2000-2006)' },
  { id: 'era_2006_2014', label: '2. Unificados, CUDA & G80/Kepler (2006-2014)' },
  { id: 'era_2014_2018', label: '3. Madurez GTX, Pascal & Maxwell (2014-2018)' },
  { id: 'era_2018_2026', label: '4. Era RTX, RDNA & Blackwell AI (2018-2026)' },
];

const tierStyleMap = {
  'S': { label: 'TOP\nTIER', badge: 'TOP TIER', bg: 'bg-[#184829]', border: 'border-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', text: 'text-emerald-400' },
  'A': { label: 'GOOD\nTIER', badge: 'GOOD TIER', bg: 'bg-[#257d42]', border: 'border-green-600', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.25)]', text: 'text-green-400' },
  'B': { label: 'NORMAL\nTIER', badge: 'NORMAL TIER', bg: 'bg-[#b88c34]', border: 'border-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]', text: 'text-amber-400' },
  'C': { label: 'BAD\nTIER', badge: 'BAD TIER', bg: 'bg-[#c4611c]', border: 'border-orange-600', glow: 'shadow-[0_0_15px_rgba(234,88,12,0.25)]', text: 'text-orange-400' },
  'D': { label: 'NOT\nBUY', badge: 'NOT BUY', bg: 'bg-[#892323]', border: 'border-red-600', glow: 'shadow-[0_0_15px_rgba(220,38,38,0.25)]', text: 'text-red-400' },
};

const legendaryPresets = [
  {
    title: '👑 2025/2026 Blackwell Apex (GeForce RTX 5090 32GB)',
    desc: 'Arquitectura Blackwell con 32GB GDDR7, DLSS 4 y Ryzen 7 9800X3D.',
    build: {
      gpu: hardwareDb.gpu.find(g => g.id === 'g_5090'),
      cpu: hardwareDb.cpu.find(c => c.id === 'c_9800x3d'),
      motherboard: hardwareDb.motherboard.find(m => m.id === 'mb_x670e'),
      ram: hardwareDb.ram.find(r => r.id === 'r_ddr5_64'),
      cooler: hardwareDb.cooler.find(cl => cl.id === 'cl_aio360'),
      storage: hardwareDb.storage.find(s => s.id === 'st_gen5'),
      case: hardwareDb.case.find(cs => cs.id === 'cs_o11'),
      psu: hardwareDb.psu.find(p => p.id === 'ps_1200')
    }
  },
  {
    title: '🏆 2006 El Rey Inmortal de Crysis (GeForce 8800 GTX)',
    desc: 'La GPU G80 que cambió la historia del renderizado 3D junto al Core 2 Quad Q6600.',
    build: {
      gpu: hardwareDb.gpu.find(g => g.id === 'g_nv_8800gtx'),
      cpu: hardwareDb.cpu.find(c => c.id === 'c_q6600'),
      motherboard: hardwareDb.motherboard.find(m => m.id === 'mb_retro775'),
      ram: hardwareDb.ram.find(r => r.id === 'r_ddr2_4'),
      cooler: hardwareDb.cooler.find(cl => cl.id === 'cl_stock'),
      storage: hardwareDb.storage.find(s => s.id === 'st_hdd'),
      case: hardwareDb.case.find(cs => cs.id === 'cs_retro'),
      psu: hardwareDb.psu.find(p => p.id === 'ps_650')
    }
  },
  {
    title: '⚡ 2017 La Leyenda Pascal (GeForce GTX 1080 Ti)',
    desc: '11GB GDDR5X que desafiaron el paso del tiempo durante casi una década.',
    build: {
      gpu: hardwareDb.gpu.find(g => g.id === 'g_1080ti'),
      cpu: hardwareDb.cpu.find(c => c.id === 'c_5600x'),
      motherboard: hardwareDb.motherboard.find(m => m.id === 'mb_b550'),
      ram: hardwareDb.ram.find(r => r.id === 'r_ddr4_32'),
      cooler: hardwareDb.cooler.find(cl => cl.id === 'cl_nhd15'),
      storage: hardwareDb.storage.find(s => s.id === 'st_gen4_1t'),
      case: hardwareDb.case.find(cs => cs.id === 'cs_4000d'),
      psu: hardwareDb.psu.find(p => p.id === 'ps_850')
    }
  },
  {
    title: '🌪️ 2010 El Volcán Fermi (GeForce GTX 480 "Thermi")',
    desc: 'El chip GF100 con disipador masivo de heatpipes expuestos junto a Sandy Bridge.',
    build: {
      gpu: hardwareDb.gpu.find(g => g.id === 'g_nv_gtx480'),
      cpu: hardwareDb.cpu.find(c => c.id === 'c_2600k'),
      motherboard: hardwareDb.motherboard.find(m => m.id === 'mb_retro775'),
      ram: hardwareDb.ram.find(r => r.id === 'r_ddr4_16'),
      cooler: hardwareDb.cooler.find(cl => cl.id === 'cl_ak620'),
      storage: hardwareDb.storage.find(s => s.id === 'st_sata'),
      case: hardwareDb.case.find(cs => cs.id === 'cs_h7flow'),
      psu: hardwareDb.psu.find(p => p.id === 'ps_850')
    }
  },
  {
    title: '🔴 2002 La Revolución DirectX 9 (ATI Radeon 9700 PRO)',
    desc: 'El chip R300 que aplastó a la competencia y definió el shader model moderno.',
    build: {
      gpu: hardwareDb.gpu.find(g => g.id === 'g_9700pro'),
      cpu: hardwareDb.cpu.find(c => c.id === 'c_athlon64'),
      motherboard: hardwareDb.motherboard.find(m => m.id === 'mb_retro775'),
      ram: hardwareDb.ram.find(r => r.id === 'r_ddr2_4'),
      cooler: hardwareDb.cooler.find(cl => cl.id === 'cl_stock'),
      storage: hardwareDb.storage.find(s => s.id === 'st_hdd'),
      case: hardwareDb.case.find(cs => cs.id === 'cs_retro'),
      psu: hardwareDb.psu.find(p => p.id === 'ps_300')
    }
  },
  {
    title: '👑 2025/2026 RDNA 4 Flagship (Radeon RX 9070 XTX)',
    desc: 'Arquitectura RDNA 4 con Ray Tracing masivo y Ryzen 7 9800X3D.',
    build: {
      gpu: hardwareDb.gpu.find(g => g.id === 'g_amd_rx9070xtx'),
      cpu: hardwareDb.cpu.find(c => c.id === 'c_9800x3d'),
      motherboard: hardwareDb.motherboard.find(m => m.id === 'mb_x670e'),
      ram: hardwareDb.ram.find(r => r.id === 'r_ddr5_64'),
      cooler: hardwareDb.cooler.find(cl => cl.id === 'cl_aio360'),
      storage: hardwareDb.storage.find(s => s.id === 'st_gen5'),
      case: hardwareDb.case.find(cs => cs.id === 'cs_o11'),
      psu: hardwareDb.psu.find(p => p.id === 'ps_1000')
    }
  }
];

const GPU3DViewer = ({ selectedGpu }) => {
  const mountRef = useRef(null);
  const [isExploded, setIsExploded] = useState(false);
  const [fansSpinning, setFansSpinning] = useState(true);
  const [fanSpeed, setFanSpeed] = useState(1);
  const [showRgb, setShowRgb] = useState(true);

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fansRef = useRef([]);
  const partsRef = useRef({});
  const originalPosRef = useRef({});
  const lightGroupRef = useRef(null);

  const activeGpu = selectedGpu || hardwareDb.gpu[0];

  useEffect(() => {
    let isCancelled = false;

    const loadThreeAndInit = async () => {
      if (!window.THREE) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (!isCancelled) initThree();
    };

    const initThree = () => {
      const THREE = window.THREE;
      if (!THREE || !mountRef.current) return;

      const container = mountRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight || 420;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      camera.position.set(6, 4.5, 7);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lights
      const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
      keyLight.position.set(6, 10, 8);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(activeGpu.accentColor || 0xef4444, 1.5);
      rimLight.position.set(-6, -4, -6);
      scene.add(rimLight);

      const rgbSpot = new THREE.PointLight(activeGpu.accentColor || 0x00f0ff, 2, 8);
      rgbSpot.position.set(0, 0.8, 1.5);
      scene.add(rgbSpot);
      lightGroupRef.current = rgbSpot;

      // GPU Assembly Group
      const gpuRoot = new THREE.Group();
      scene.add(gpuRoot);

      // Form factor detection
      const isRetro = activeGpu.form.includes('retro');
      const isMassive = activeGpu.form === 'massive';
      const isBlower = activeGpu.form === 'blower';
      const isDualGpu = activeGpu.form === 'dual-gpu';
      const isAtiBrand = activeGpu.brand === 'ATI';
      
      const pcbLength = isMassive || isDualGpu ? 5.4 : isRetro ? 3.4 : 4.4;
      const pcbWidth = isMassive || isDualGpu ? 2.2 : 1.6;
      const pcbThickness = 0.08;

      partsRef.current = {};
      originalPosRef.current = {};
      fansRef.current = [];

      // 1. BACKPLATE (Only modern cards)
      if (!isRetro && !isAtiBrand) {
        const bpGeo = new THREE.BoxGeometry(pcbLength, 0.06, pcbWidth);
        const bpMat = new THREE.MeshStandardMaterial({ 
          color: 0x18181b, 
          metalness: 0.85, 
          roughness: 0.25 
        });
        const backplate = new THREE.Mesh(bpGeo, bpMat);
        backplate.position.y = -0.55;
        gpuRoot.add(backplate);
        partsRef.current.backplate = backplate;
        originalPosRef.current.backplate = backplate.position.clone();
      }

      // 2. PCB (Circuito Impreso con color según marca)
      const pcbColor = isAtiBrand ? 0x991b1b : isRetro ? 0x15803d : 0x09090b;
      const pcbGeo = new THREE.BoxGeometry(pcbLength, pcbThickness, pcbWidth);
      const pcbMat = new THREE.MeshStandardMaterial({ 
        color: pcbColor, 
        roughness: 0.7 
      });
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.position.y = -0.4;
      gpuRoot.add(pcb);
      partsRef.current.pcb = pcb;
      originalPosRef.current.pcb = pcb.position.clone();

      // GPU Silicon Dies (Single or Dual GPU)
      if (isDualGpu) {
        // Dual GPU dies (HD 3870 X2, HD 4870 X2, HD 5970, HD 6990, HD 7990)
        [-pcbLength * 0.25, pcbLength * 0.25].forEach(xOff => {
          const dieGeo = new THREE.BoxGeometry(0.65, 0.06, 0.65);
          const dieMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
          const die = new THREE.Mesh(dieGeo, dieMat);
          die.position.set(xOff, 0.05, 0);
          pcb.add(die);
        });
        // PCIe Bridge PLX chip in middle
        const plxGeo = new THREE.BoxGeometry(0.35, 0.04, 0.35);
        const plxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
        const plx = new THREE.Mesh(plxGeo, plxMat);
        plx.position.set(0, 0.04, 0);
        pcb.add(plx);
      } else {
        // Single GPU die
        const dieGeo = new THREE.BoxGeometry(0.75, 0.06, 0.75);
        const dieMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
        const die = new THREE.Mesh(dieGeo, dieMat);
        die.position.set(0, 0.05, 0);
        pcb.add(die);
      }

      // PCIe Gold Finger connector
      const pcieGeo = new THREE.BoxGeometry(2.5, 0.02, 0.2);
      const pcieMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
      const pcie = new THREE.Mesh(pcieGeo, pcieMat);
      pcie.position.set(-0.5, 0, (pcbWidth / 2) + 0.1);
      pcb.add(pcie);

      // 3. HEATSINK (Disipador de Aletas & Heatpipes)
      const hsHeight = isMassive ? 0.7 : isRetro ? 0.25 : 0.45;
      const hsGeo = new THREE.BoxGeometry(pcbLength - 0.2, hsHeight, pcbWidth - 0.2);
      const hsMat = new THREE.MeshStandardMaterial({ 
        color: isRetro || isAtiBrand ? 0xd97706 : 0x71717a, 
        metalness: 0.9, 
        roughness: 0.25 
      });
      const heatsink = new THREE.Mesh(hsGeo, hsMat);
      heatsink.position.y = -0.05;
      gpuRoot.add(heatsink);
      partsRef.current.heatsink = heatsink;
      originalPosRef.current.heatsink = heatsink.position.clone();

      // 4. SHROUD (Carcasa exterior)
      const shroudHeight = isMassive ? 0.8 : isRetro ? 0.3 : 0.5;
      const shroudGeo = new THREE.BoxGeometry(pcbLength + 0.1, shroudHeight, pcbWidth + 0.1);
      const shroudMat = new THREE.MeshStandardMaterial({ 
        color: activeGpu.color || 0x1e293b, 
        roughness: 0.35, 
        metalness: 0.5 
      });
      const shroud = new THREE.Mesh(shroudGeo, shroudMat);
      shroud.position.y = 0.45;
      gpuRoot.add(shroud);
      partsRef.current.shroud = shroud;
      originalPosRef.current.shroud = shroud.position.clone();

      // ARGB LED Bar on Shroud (Modern non-retro cards)
      if (!isRetro && activeGpu.year >= 2018) {
        const ledBarGeo = new THREE.BoxGeometry(pcbLength - 1, 0.08, 0.05);
        const ledBarMat = new THREE.MeshBasicMaterial({ color: activeGpu.accentColor || 0x00f0ff });
        const ledBar = new THREE.Mesh(ledBarGeo, ledBarMat);
        ledBar.position.set(0, (shroudHeight / 2) - 0.05, (pcbWidth / 2) + 0.06);
        shroud.add(ledBar);
        partsRef.current.ledBar = ledBar;
      }

      // 5. FANS (Ventiladores según activeGpu.fans o blower)
      const fanCount = activeGpu.fans !== undefined ? activeGpu.fans : 2;
      const fanRadius = isBlower ? 0.5 : isMassive ? 0.65 : 0.52;
      
      if (fanCount > 0) {
        const fanGeo = new THREE.CylinderGeometry(fanRadius, fanRadius, 0.08, 24);
        const fanMat = new THREE.MeshStandardMaterial({ color: isBlower ? 0x991b1b : 0x111111, roughness: 0.4 });

        const fanPositions = isBlower 
          ? [pcbLength * 0.28] 
          : fanCount === 3 
            ? [-pcbLength * 0.28, 0, pcbLength * 0.28]
            : fanCount === 2 
              ? [-pcbLength * 0.22, pcbLength * 0.22]
              : [0];

        fanPositions.forEach(xOffset => {
          const fan = new THREE.Mesh(fanGeo, fanMat);
          fan.position.set(xOffset, (shroudHeight / 2) + 0.05, 0);
          
          // Fan Blades
          const bladeCount = isBlower ? 16 : 9;
          for (let i = 0; i < bladeCount; i++) {
            const bladeGeo = new THREE.BoxGeometry(fanRadius * 0.9, 0.02, 0.12);
            const bladeMat = new THREE.MeshStandardMaterial({ color: isBlower ? 0x7f1d1d : 0x1f2937 });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.y = ((Math.PI * 2) / bladeCount) * i;
            blade.rotation.z = 0.15;
            fan.add(blade);
          }

          shroud.add(fan);
          fansRef.current.push(fan);
        });
      }

      // Mouse Drag Rotation
      let isDragging = false;
      let prevMouse = { x: 0, y: 0 };
      let targetRot = { x: 0.4, y: -0.6 };
      let currentRot = { x: 0.4, y: -0.6 };

      const onMouseDown = (e) => {
        isDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      };
      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        targetRot.y += dx * 0.01;
        targetRot.x += dy * 0.01;
        targetRot.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRot.x));
        prevMouse = { x: e.clientX, y: e.clientY };
      };
      const onMouseUp = () => { isDragging = false; };

      const domElem = renderer.domElement;
      domElem.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Touch controls
      domElem.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - prevMouse.x;
        const dy = e.touches[0].clientY - prevMouse.y;
        targetRot.y += dx * 0.01;
        targetRot.x += dy * 0.01;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }, { passive: true });
      window.addEventListener('touchend', () => { isDragging = false; });

      // Animation Loop
      let clock = new THREE.Clock();
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Smooth rotation
        currentRot.x += (targetRot.x - currentRot.x) * 0.1;
        currentRot.y += (targetRot.y - currentRot.y) * 0.1;
        gpuRoot.rotation.x = currentRot.x;
        gpuRoot.rotation.y = currentRot.y;

        // Auto slow turntable rotation if idle
        if (!isDragging) {
          targetRot.y += 0.003;
        }

        // ARGB Color shift
        if (rgbSpot && showRgb && activeGpu.year >= 2018) {
          const r = Math.sin(time * 2) * 0.5 + 0.5;
          const g = Math.sin(time * 2 + 2) * 0.5 + 0.5;
          const b = Math.sin(time * 2 + 4) * 0.5 + 0.5;
          rgbSpot.color.setRGB(r, g, b);
          if (partsRef.current.ledBar) {
            partsRef.current.ledBar.material.color.setRGB(r, g, b);
          }
        }

        // Fan Spin
        if (fansSpinning && fansRef.current.length > 0) {
          fansRef.current.forEach(fan => {
            fan.rotation.y += 0.25 * fanSpeed;
          });
        }

        // Explode / Assembly interpolation
        const explodeMult = isExploded ? 1.0 : 0.0;
        const offsets = {
          shroud: 1.6 * explodeMult,
          heatsink: 0.6 * explodeMult,
          pcb: -0.2 * explodeMult,
          backplate: -1.0 * explodeMult
        };

        Object.keys(offsets).forEach(partKey => {
          const mesh = partsRef.current[partKey];
          const orig = originalPosRef.current[partKey];
          if (mesh && orig) {
            mesh.position.y += (orig.y + offsets[partKey] - mesh.position.y) * 0.12;
          }
        });

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!mountRef.current || !renderer || !camera) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight || 420;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        domElem.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        cancelAnimationFrame(animationFrameRef.current);
        renderer.dispose();
      };
    };

    loadThreeAndInit();
    return () => { isCancelled = true; };
  }, [activeGpu, isExploded, fansSpinning, fanSpeed, showRgb]);

  return (
    <div className="w-full relative glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-2xl flex flex-col">
      {/* Top HUD with GPU Telemetry */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-xs">
        <div className="bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">GPU 3D Motor Activo</span>
          </div>
          <h3 className="text-sm font-black text-white truncate">{activeGpu.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
            <span className="text-cyan-400 font-bold">{activeGpu.year}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{activeGpu.brand}</span>
            <span>•</span>
            <span>{activeGpu.vram}</span>
            <span>•</span>
            <span className="text-red-400 font-bold">{activeGpu.tdp}W TDP</span>
          </div>
          {activeGpu.architecture && (
            <div className="text-[10px] text-slate-400 mt-1">
              Arq: <span className="text-white font-mono">{activeGpu.architecture}</span>
            </div>
          )}
        </div>

        {/* 3D Action Controls */}
        <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 flex flex-col gap-2">
          <button
            onClick={() => setIsExploded(!isExploded)}
            className={`flex items-center justify-between text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
              isExploded 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Desarmado (Explode)</span>
            <span className="text-[10px] uppercase font-black">{isExploded ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setFansSpinning(!fansSpinning)}
            className={`flex items-center justify-between text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
              fansSpinning 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <RotateCw className={`w-4 h-4 ${fansSpinning ? 'animate-spin' : ''}`} /> Coolers Activos
            </span>
            <span className="text-[10px] uppercase font-black">{fansSpinning ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowRgb(!showRgb)}
            className={`flex items-center justify-between text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
              showRgb 
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Iluminación ARGB</span>
            <span className="text-[10px] uppercase font-black">{showRgb ? 'ON' : 'OFF'}</span>
          </button>

          {fansSpinning && activeGpu.fans > 0 && (
            <div className="pt-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                <span>Velocidad Ventiladores</span>
                <span className="text-cyan-400 font-mono">{(fanSpeed * 1800).toFixed(0)} RPM</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={fanSpeed}
                onChange={(e) => setFanSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Helper Footer overlay */}
      <div className="absolute bottom-3 left-0 w-full text-center pointer-events-none text-slate-500 text-[11px] font-bold tracking-widest uppercase">
        Arrastra para rotar 360º • Modelo adaptativo según GPU seleccionada
      </div>

      {/* Three.js Canvas container */}
      <div ref={mountRef} className="w-full h-[450px] cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('builder'); // builder, tierlist, 3d, compare
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [filterEra, setFilterEra] = useState('ALL_ERAS');
  const [selectedResolution, setSelectedResolution] = useState('1440p'); // 1080p, 1440p, 4k

  // Current PC Build State
  const [build, setBuild] = useState({
    cpu: hardwareDb.cpu[0], // 9800X3D default
    gpu: hardwareDb.gpu.find(g => g.id === 'g_amd_rx9070xtx') || hardwareDb.gpu[0],
    motherboard: hardwareDb.motherboard[1], // x670e default
    ram: hardwareDb.ram[0], // 64gb ddr5
    cooler: hardwareDb.cooler[0], // aio 360
    storage: hardwareDb.storage[0], // t700 gen5
    case: hardwareDb.case[0], // o11 vision
    psu: hardwareDb.psu[0] // 1200w gold
  });

  const [compareA, setCompareA] = useState(hardwareDb.gpu.find(g => g.id === 'g_amd_rx9070xtx') || hardwareDb.gpu[0]);
  const [compareB, setCompareB] = useState(hardwareDb.gpu.find(g => g.id === 'g_9700pro') || hardwareDb.gpu[4]);

  const handleLoadPreset = (preset) => {
    setBuild(preset.build);
  };

  const handleSelectComponent = (category, item) => {
    setBuild(prev => ({
      ...prev,
      [category]: item
    }));
  };

  const telemetry = useMemo(() => {
    const totalTdp = Object.values(build).reduce((acc, item) => acc + (item?.tdp || 15), 0);
    const totalPrice = Object.values(build).reduce((acc, item) => acc + (item?.price || 0), 0);

    let cpuScore = build.cpu?.score || 50;
    let gpuScore = build.gpu?.score || 50;

    let resCpuWeight = selectedResolution === '1080p' ? 1.3 : selectedResolution === '1440p' ? 1.0 : 0.75;
    let resGpuWeight = selectedResolution === '1080p' ? 0.75 : selectedResolution === '1440p' ? 1.0 : 1.45;

    const weightedCpu = cpuScore * resCpuWeight;
    const weightedGpu = gpuScore * resGpuWeight;
    const ratio = weightedCpu / weightedGpu;

    let bottleneckType = 'none';
    let bottleneckPercent = 0;
    let bottleneckTitle = 'Ensamble Equilibrado';
    let bottleneckDesc = 'Sinergia excelente entre procesador y tarjeta gráfica para esta resolución.';

    if (ratio < 0.75) {
      bottleneckType = 'cpu';
      bottleneckPercent = Math.min(65, Math.round((1 - ratio) * 100));
      bottleneckTitle = `Cuello de Botella de CPU (${bottleneckPercent}%)`;
      bottleneckDesc = `Tu procesador no puede enviar fotogramas con la rapidez que la GPU es capaz de renderizar en ${selectedResolution}.`;
    } else if (ratio > 1.35) {
      bottleneckType = 'gpu';
      bottleneckPercent = Math.min(70, Math.round((ratio - 1) * 60));
      bottleneckTitle = `Cuello de Botella de GPU (${bottleneckPercent}%)`;
      bottleneckDesc = `Tienes potencia de cálculo de CPU excedente. La gráfica operará al 100% mientras la CPU descansa.`;
    }

    const cpuTdp = build.cpu?.tdp || 65;
    const coolerMaxTdp = build.cooler?.tdpMax || 150;
    const thermalThrottlingRisk = cpuTdp > coolerMaxTdp;

    const psuWattage = build.psu?.wattage || 600;
    const recommendedPsu = Math.round(totalTdp * 1.35);
    const psuDanger = totalTdp > (psuWattage * 0.85);

    const tierScores = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
    const items = Object.values(build).filter(Boolean);
    const avgTierVal = items.reduce((acc, curr) => acc + (tierScores[curr.tier] || 3), 0) / items.length;
    const roundedTier = avgTierVal >= 4.4 ? 'S' : avgTierVal >= 3.4 ? 'A' : avgTierVal >= 2.4 ? 'B' : avgTierVal >= 1.5 ? 'C' : 'D';

    return {
      totalTdp,
      totalPrice,
      bottleneckType,
      bottleneckPercent,
      bottleneckTitle,
      bottleneckDesc,
      thermalThrottlingRisk,
      recommendedPsu,
      psuDanger,
      overallTier: roundedTier,
      weightedCpu,
      weightedGpu
    };
  }, [build, selectedResolution]);

  const filterHardware = (list) => {
    return list.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        item.name.toLowerCase().includes(q) ||
        (item.year && item.year.toString().includes(q)) ||
        (item.tier && item.tier.toLowerCase() === q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.architecture && item.architecture.toLowerCase().includes(q));
      
      const matchBrand = 
        filterBrand === 'ALL' || 
        item.brand === filterBrand || 
        (filterBrand === 'ATI' && item.brand.includes('ATI')) ||
        (filterBrand === 'AMD' && item.brand.includes('AMD')) ||
        (filterBrand === 'NVIDIA' && item.brand.includes('NVIDIA'));
      
      const matchEra = filterEra === 'ALL_ERAS' || 
        item.era === filterEra || 
        (filterEra === 'era_2000_2006' && (item.era === 'ati_2000_2006' || item.era === 'era_2000_2006' || (item.year >= 2000 && item.year <= 2006))) ||
        (filterEra === 'era_2006_2014' && (item.era === 'trans_2007_2010' || item.era === 'era_2006_2014' || (item.year > 2006 && item.year <= 2014))) ||
        (filterEra === 'era_2014_2018' && (item.era === 'era_2014_2018' || (item.year > 2014 && item.year <= 2018))) ||
        (filterEra === 'era_2018_2026' && (item.era === 'rdna_2019_2026' || item.era === 'era_2018_2026' || (item.year >= 2018 && item.year <= 2026)));

      return matchQuery && matchBrand && matchEra;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      <style>{customStyles}</style>

      {/* TOP HEADER */}
      <header className="glass-panel sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight argb-text flex items-center gap-2">
                Vértice <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">ATI & AMD 2000-2026</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">
                Simulador de Ensamble • Historia Gráfica • 3D Interactivo
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            {[
              { id: 'builder', label: 'Ensamble', icon: CircuitBoard },
              { id: 'tierlist', label: 'Tier List', icon: Award },
              { id: '3d', label: '3D GPU Engine', icon: RotateCw },
              { id: 'compare', label: 'Comparativa', icon: Scale },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* QUICK PRESETS CAROUSEL BAR */}
      <div className="bg-slate-900/70 border-b border-slate-800/80 py-2.5 px-4 overflow-x-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-3 min-w-max">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <History className="w-4 h-4 text-cyan-400" /> Hitos Legendarios:
          </span>
          {legendaryPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="text-xs font-bold bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
            >
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 py-8">

        {/* ========================================================================= */}
        {/* TAB 1: BUILDER */}
        {/* ========================================================================= */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT 8 COLS: COMPONENT SELECTION */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Search, Brand Filter & Era Selector */}
              <div className="flex flex-col gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar componente, año o arq (ej. RDNA 4, 9700 Pro, GCN)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
                    {['ALL', 'ATI', 'AMD', 'NVIDIA', 'Intel'].map(brand => (
                      <button
                        key={brand}
                        onClick={() => setFilterBrand(brand)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-black transition-all ${
                          filterBrand === brand 
                            ? 'bg-cyan-500 text-slate-950 font-black shadow-md' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Historical Era Selector Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 overflow-x-auto custom-scrollbar">
                  <span className="text-[11px] font-black uppercase text-slate-500 shrink-0">Filtrar Era:</span>
                  {eraCategories.map(era => (
                    <button
                      key={era.id}
                      onClick={() => setFilterEra(era.id)}
                      className={`shrink-0 text-[11px] px-2.5 py-1 rounded-md font-bold transition-all ${
                        filterEra === era.id
                          ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {era.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIST OF CATEGORIES */}
              {[
                { key: 'gpu', label: 'Tarjeta Gráfica (GPU)', icon: Monitor },
                { key: 'cpu', label: 'Procesador (CPU)', icon: Cpu },
                { key: 'cooler', label: 'Disipador / Refrigeración', icon: Wind },
                { key: 'motherboard', label: 'Placa Madre (Motherboard)', icon: CircuitBoard },
                { key: 'ram', label: 'Memoria RAM', icon: MemoryStick },
                { key: 'storage', label: 'Almacenamiento (M.2 / SSD)', icon: HardDrive },
                { key: 'case', label: 'Gabinete (Case)', icon: Box },
                { key: 'psu', label: 'Fuente de Poder (PSU)', icon: Zap },
              ].map(cat => {
                const currentItem = build[cat.key];
                const list = filterHardware(hardwareDb[cat.key] || []);

                return (
                  <div key={cat.key} className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400">
                          <cat.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs uppercase font-black tracking-wider text-slate-400">{cat.label}</h4>
                          <p className="text-sm font-black text-white">{currentItem?.name || 'No seleccionado'}</p>
                        </div>
                      </div>
                      {currentItem && (
                        <div className="text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black border uppercase ${tierStyleMap[currentItem.tier]?.bg} ${tierStyleMap[currentItem.tier]?.border} text-white`}>
                            {tierStyleMap[currentItem.tier]?.badge}
                          </span>
                          <p className="text-sm font-black text-emerald-400 mt-1 font-mono">${currentItem.price}</p>
                        </div>
                      )}
                    </div>

                    {/* Horizontal scroll of choices for this category */}
                    <div className="p-3 bg-slate-950/60 flex gap-3 overflow-x-auto custom-scrollbar">
                      {list.map(item => {
                        const isSelected = currentItem?.id === item.id;
                        const tStyle = tierStyleMap[item.tier];

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectComponent(cat.key, item)}
                            className={`shrink-0 w-64 p-3 rounded-xl border cursor-pointer transition-all relative ${
                              isSelected 
                                ? `${tStyle.border} bg-slate-900/90 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500` 
                                : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black text-white ${tStyle.bg}`}>
                                {item.tier} TIER
                              </span>
                              <span className="text-xs font-mono font-bold text-emerald-400">${item.price}</span>
                            </div>

                            <p className="text-xs font-bold text-white mt-2 line-clamp-2">{item.name}</p>

                            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                              {item.brand && <div>Marca: <span className="text-cyan-400 font-semibold">{item.brand}</span></div>}
                              {item.architecture && <div>Arq: <span className="text-slate-300 font-semibold">{item.architecture}</span></div>}
                              {item.year && <div>Año: <span className="text-slate-300 font-semibold">{item.year}</span></div>}
                              {item.tdp && <div>Consumo: <span className="text-red-400 font-semibold">{item.tdp}W TDP</span></div>}
                              {item.socket && <div>Socket: <span className="text-slate-300 font-semibold">{item.socket}</span></div>}
                              {item.vram && <div>VRAM: <span className="text-slate-300 font-semibold">{item.vram}</span></div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT 4 COLS: TELEMETRY & AUDIT */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* GLOBAL TIER BADGE */}
              <div className={`p-6 rounded-2xl border-2 glass-panel ${tierStyleMap[telemetry.overallTier].border} ${tierStyleMap[telemetry.overallTier].glow}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Nivel del Ensamble</span>
                  <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Balance Dinámico
                  </span>
                </div>

                <div className="flex items-center gap-5 mt-4">
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-xl ${tierStyleMap[telemetry.overallTier].bg}`}>
                    <span className="text-3xl leading-none">{telemetry.overallTier}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-80">TIER</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {telemetry.overallTier === 'S' ? 'Bestia Absoluta' :
                       telemetry.overallTier === 'A' ? 'Gama Alta Elite' :
                       telemetry.overallTier === 'B' ? 'Gama Media Sólida' :
                       telemetry.overallTier === 'C' ? 'Gama de Entrada' : 'Retro / Básico'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Presupuesto Estimado: <span className="text-emerald-400 font-mono font-bold text-sm">${telemetry.totalPrice}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* BOTTLENECK SIMULATOR */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" /> Cuello de Botella
                  </h3>
                  
                  {/* Resolution Selector */}
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
                    {['1080p', '1440p', '4k'].map(res => (
                      <button
                        key={res}
                        onClick={() => setSelectedResolution(res)}
                        className={`px-2 py-0.5 rounded transition-all uppercase ${
                          selectedResolution === res 
                            ? 'bg-cyan-500 text-slate-950 font-black' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottleneck Warning Box */}
                <div className={`p-3.5 rounded-xl border ${
                  telemetry.bottleneckType === 'none' 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                    : telemetry.bottleneckPercent > 35 
                      ? 'bg-red-950/30 border-red-500/40 text-red-300' 
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                }`}>
                  <div className="flex items-center gap-2 font-black text-xs uppercase">
                    {telemetry.bottleneckType === 'none' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {telemetry.bottleneckTitle}
                  </div>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">{telemetry.bottleneckDesc}</p>
                </div>

                {/* Visual Ratio Bar */}
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    <span className="text-cyan-400">CPU Load (Ratio)</span>
                    <span className="text-emerald-400">GPU Load (Ratio)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div 
                      className="bg-cyan-500 h-full transition-all duration-500" 
                      style={{ width: `${(telemetry.weightedCpu / (telemetry.weightedCpu + telemetry.weightedGpu)) * 100}%` }}
                    />
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${(telemetry.weightedGpu / (telemetry.weightedCpu + telemetry.weightedGpu)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* THERMAL & POWER AUDIT */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> Auditoría Eléctrica y Térmica
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Consumo Estimado (TDP):</span>
                    <span className="font-mono font-black text-white text-sm">{telemetry.totalTdp} W</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Fuente Sugerida (+ Margen):</span>
                    <span className="font-mono font-black text-cyan-400 text-sm">{telemetry.recommendedPsu} W</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Fuente Actual Seleccionada:</span>
                    <span className="font-mono font-black text-white text-sm">{build.psu?.wattage || 0} W</span>
                  </div>

                  {telemetry.psuDanger && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/50 text-[11px] text-red-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                      Peligro: La fuente actual corre riesgo de apagados repentinos por picos de microsegundos de la GPU.
                    </div>
                  )}

                  {telemetry.thermalThrottlingRisk && (
                    <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-500/50 text-[11px] text-orange-300 flex items-center gap-2">
                      <Flame className="w-4 h-4 shrink-0 text-orange-400" />
                      Alerta Térmica: El procesador superará la disipación máxima recomendada de este cooler.
                    </div>
                  )}
                </div>
              </div>

              {/* QUICK JUMP TO 3D INSPECTION */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase">Inspección 3D Disponible</h4>
                  <p className="text-[11px] text-slate-400">Visualiza la {build.gpu?.name} en tiempo real.</p>
                </div>
                <button
                  onClick={() => setActiveTab('3d')}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center gap-1"
                >
                  Abrir <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TIER LIST */}
        {/* ========================================================================= */}
        {activeTab === 'tierlist' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <h2 className="text-3xl font-black uppercase argb-text">ATI, AMD & NVIDIA GPU Tier List</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">
                Clasificación histórica (2000 - 2026). Haz clic en cualquier tarjeta para equiparla.
              </p>
            </div>

            <div className="space-y-3 max-w-5xl mx-auto">
              {['S', 'A', 'B', 'C', 'D'].map(tierLevel => {
                const gpusInTier = filterHardware(hardwareDb.gpu.filter(g => g.tier === tierLevel));
                const tStyle = tierStyleMap[tierLevel];

                return (
                  <div 
                    key={tierLevel} 
                    className="flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-slate-800 shadow-xl transition-all hover:border-slate-600"
                  >
                    {/* LEFT BADGE */}
                    <div className={`sm:w-36 shrink-0 ${tStyle.bg} p-4 flex items-center justify-center text-center shadow-inner`}>
                      <span className="text-lg sm:text-xl font-black text-white tracking-widest leading-tight whitespace-pre-line drop-shadow-md">
                        {tStyle.label}
                      </span>
                    </div>

                    {/* CENTER: LIST OF GPUS */}
                    <div className="flex-1 bg-slate-900/90 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                      {gpusInTier.map(gpu => {
                        const isEquipped = build.gpu?.id === gpu.id;
                        return (
                          <div
                            key={gpu.id}
                            onClick={() => handleSelectComponent('gpu', gpu)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                              isEquipped 
                                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-black text-sm">{gpu.name}</span>
                              {isEquipped && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                            </div>
                            <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                              <span>{gpu.brand} • {gpu.vram}</span>
                              <span className="font-mono text-emerald-400 font-bold">${gpu.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* RIGHT: REPRESENTATIVE IMAGE */}
                    <div className="hidden md:flex w-44 bg-slate-950 shrink-0 items-center justify-center p-3 border-l border-slate-800">
                      <img 
                        src={gpusInTier[0]?.img || 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=300'} 
                        alt="GPU Showcase" 
                        className="w-full h-auto object-cover opacity-70 hover:opacity-100 transition-opacity drop-shadow-2xl" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 3D GPU ENGINE */}
        {/* ========================================================================= */}
        {activeTab === '3d' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase text-white flex items-center gap-2">
                  Motor 3D Paramétrico <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">WebGL Three.js</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Inspección milimétrica de estructura térmica, disipadores de cobre, turbinas blower y silicio dual.
                </p>
              </div>

              {/* Quick GPU Switcher for 3D */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Cambiar Modelo:</span>
                <select
                  value={build.gpu?.id}
                  onChange={(e) => {
                    const found = hardwareDb.gpu.find(g => g.id === e.target.value);
                    if (found) handleSelectComponent('gpu', found);
                  }}
                  className="bg-slate-900 border border-slate-700 text-xs font-bold text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400 max-w-xs"
                >
                  {hardwareDb.gpu.map(g => (
                    <option key={g.id} value={g.id}>{g.year} - {g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* THREE.JS VIEWER COMPONENT */}
            <GPU3DViewer selectedGpu={build.gpu} />

            {/* TECHNICAL BLUEPRINT EXPLANATIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-black uppercase text-cyan-400 mb-1 flex items-center gap-2">
                  <CircuitBoard className="w-4 h-4" /> Arquitectura del PCB & Silicio Dual
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Laminado multicapa adaptado por marca. Las tarjetas dual-GPU míticas (como HD 3870 X2, HD 5970 y HD 6990) renderizan dos chips de silicio independientes comunicados por puente PLX.
                </p>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-black uppercase text-emerald-400 mb-1 flex items-center gap-2">
                  <Wind className="w-4 h-4" /> Cobre Retro & Cámaras de Vapor
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Desde los disipadores de cobre macizo de un solo slot de la Radeon 9700 Pro (2002) hasta las cámaras de vapor masivas de 3.5 slots de la serie RDNA 4 y RTX 40/50.
                </p>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-black uppercase text-fuchsia-400 mb-1 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" /> Turbinas Blower & Axial-Tech
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Soporte procedimental para coolers tipo turbina centrífuga (estilo Radeon HD 2900 XT, R9 290X y RX 5700 XT) y triples ventiladores axiales con control de RPM dinámico.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: COMPARATIVE */}
        {/* ========================================================================= */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-black uppercase text-white">Laboratorio de Comparación Histórica</h2>
              <p className="text-xs text-slate-400 mt-1">
                Compara dos tarjetas cara a cara: desde la ATI Radeon 9700 Pro (2002) hasta la Radeon RX 9070 XTX (2025/2026).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* COMPONENT A */}
              <div className="glass-panel p-5 rounded-2xl border border-cyan-500/40">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Contendiente A</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black text-white ${tierStyleMap[compareA.tier].bg}`}>
                    {compareA.tier} TIER
                  </span>
                </div>

                <select
                  value={compareA.id}
                  onChange={(e) => setCompareA(hardwareDb.gpu.find(g => g.id === e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold mb-4 focus:outline-none focus:border-cyan-400"
                >
                  {hardwareDb.gpu.map(g => (
                    <option key={g.id} value={g.id}>{g.year} • [{g.brand}] {g.name}</option>
                  ))}
                </select>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Marca y Arquitectura:</span>
                    <span className="font-bold text-cyan-400">{compareA.brand} ({compareA.architecture || 'N/D'})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Año de Lanzamiento:</span>
                    <span className="font-bold text-white">{compareA.year}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Memoria VRAM:</span>
                    <span className="font-bold text-white">{compareA.vram}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Consumo (TDP):</span>
                    <span className="font-bold text-red-400">{compareA.tdp}W</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Interfaz de Bus:</span>
                    <span className="font-bold text-slate-300">{compareA.pcie}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Puntaje Relativo:</span>
                    <span className="font-black text-cyan-400 font-mono text-sm">{compareA.score} pts</span>
                  </div>
                </div>
              </div>

              {/* COMPONENT B */}
              <div className="glass-panel p-5 rounded-2xl border border-fuchsia-500/40">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-fuchsia-400">Contendiente B</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black text-white ${tierStyleMap[compareB.tier].bg}`}>
                    {compareB.tier} TIER
                  </span>
                </div>

                <select
                  value={compareB.id}
                  onChange={(e) => setCompareB(hardwareDb.gpu.find(g => g.id === e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold mb-4 focus:outline-none focus:border-fuchsia-400"
                >
                  {hardwareDb.gpu.map(g => (
                    <option key={g.id} value={g.id}>{g.year} • [{g.brand}] {g.name}</option>
                  ))}
                </select>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Marca y Arquitectura:</span>
                    <span className="font-bold text-fuchsia-400">{compareB.brand} ({compareB.architecture || 'N/D'})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Año de Lanzamiento:</span>
                    <span className="font-bold text-white">{compareB.year}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Memoria VRAM:</span>
                    <span className="font-bold text-white">{compareB.vram}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Consumo (TDP):</span>
                    <span className="font-bold text-red-400">{compareB.tdp}W</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Interfaz de Bus:</span>
                    <span className="font-bold text-slate-300">{compareB.pcie}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Puntaje Relativo:</span>
                    <span className="font-black text-fuchsia-400 font-mono text-sm">{compareB.score} pts</span>
                  </div>
                </div>
              </div>

            </div>

            {/* PERFORMANCE BAR COMPARISON */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <h4 className="text-sm font-black uppercase text-white mb-2">Relación de Rendimiento Teórico</h4>
              <p className="text-xs text-slate-400 max-w-xl mx-auto mb-4">
                La <strong className="text-cyan-400">{compareA.name} ({compareA.year})</strong> tiene {compareA.score} puntos comparada con los {compareB.score} puntos de la <strong className="text-fuchsia-400">{compareB.name} ({compareB.year})</strong>.
              </p>

              <div className="w-full max-w-xl mx-auto h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-500" 
                  style={{ width: `${(compareA.score / (compareA.score + compareB.score)) * 100}%` }}
                />
                <div 
                  className="bg-fuchsia-500 h-full transition-all duration-500" 
                  style={{ width: `${(compareB.score / (compareA.score + compareB.score)) * 100}%` }}
                />
              </div>

              <div className="flex justify-between max-w-xl mx-auto text-[10px] font-black uppercase mt-1 text-slate-400">
                <span className="text-cyan-400">{((compareA.score / (compareA.score + compareB.score)) * 100).toFixed(0)}%</span>
                <span className="text-fuchsia-400">{((compareB.score / (compareA.score + compareB.score)) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}