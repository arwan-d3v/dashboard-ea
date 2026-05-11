"use client";

import { useState } from "react";
import { ChevronRight, Cpu, Crown, Radar, Activity, Zap, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Custom SVG Shanks Claw untuk Beast Mode
const ShanksClawMarks = ({ size = 24, className, ...props }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 3 L5 21" />
    <path d="M12 4 L10 20" />
    <path d="M17 3 L15 21" />
  </svg>
);

// ============================================================================
// DICTIONARY BILINGUAL (EN & ID)
// ============================================================================
const dict = {
  en: {
    live_node: "Live Cloud Node Active",
    title_1: "QUANTITATIVE",
    title_2: "SUPREMACY.",
    description: "A decentralized algorithmic trading system driven by XGBoost Machine Learning and real-time Firebase Cloud synchronization. Emotionless, pure computational precision.",
    btn_enter: "ENTER COMMAND CENTER",
    arsenal_title: "THE ARSENAL",
    arsenal_sub: "Choose your artificial intelligence architecture",
    bots: {
      god: "Absolute precision AI specialist. Trained on millions of rows of historical data to execute positions only when the win ratio exceeds critical thresholds.",
      beast: "Aggressive predator seeking momentum. Sniffs out liquidity pools and rides breakout volumes when the market is at peak volatility.",
      enigma: "Limit Order trap specialist. Analyzes market microstructure to detect BPR anomalies and sets nets at the Optimal Trade Entry (OTE) zone.",
      klasik: "Classic algorithmic foundation without AI. Runs on a pure mathematical framework to dampen XAUUSD volatility through layered dynamic grids."
    }
  },
  id: {
    live_node: "Node Cloud Aktif",
    title_1: "QUANTITATIVE",
    title_2: "SUPREMACY.",
    description: "Sistem trading algoritmik terdesentralisasi yang digerakkan oleh Machine Learning XGBoost dan sinkronisasi Cloud Firebase secara real-time. Bebas emosi, murni komputasi presisi.",
    btn_enter: "MASUK RUANG KENDALI",
    arsenal_title: "THE ARSENAL",
    arsenal_sub: "Pilih arsitektur kecerdasan buatan Anda",
    bots: {
      god: "AI spesialis presisi absolut. Dilatih dengan jutaan baris data historis untuk mengeksekusi posisi hanya saat rasio kemenangan berada di atas ambang batas kritis.",
      beast: "Predator agresif pencari momentum. Mengendus penumpukan likuiditas dan menunggangi volume breakout saat pasar berada di titik puncak volatilitas.",
      enigma: "Spesialis perangkap Limit Order. Menganalisis mikrostuktur pasar untuk mendeteksi anomali BPR dan menempatkan jaring pada zona Optimal Trade Entry (OTE).",
      klasik: "Fondasi algoritma klasik tanpa AI. Berjalan pada kerangka matematis murni untuk meredam volatilitas XAUUSD melalui grid dinamis berlapis."
    }
  }
};

export default function LandingPage() {
  // State untuk bahasa, default 'en'
  const [lang, setLang] = useState("en");
  const t = dict[lang];

  const botArsenal = [
    {
      id: "god",
      name: "GOD HEALER",
      type: "MACHINE LEARNING",
      vibe: "High Precision | Golden Ratio Exec",
      desc: t.bots.god,
      image: "/images/god_mode.jpg",
      accent: "text-amber-500",
      borderGlow: "group-hover:border-amber-500/50 group-hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]",
      icon: Crown
    },
    {
      id: "beast",
      name: "BEAST WATCHER",
      type: "MACHINE LEARNING",
      vibe: "Liquidity Hunter | Maximum Volume",
      desc: t.bots.beast,
      image: "/images/beast_mode.webp",
      accent: "text-red-500",
      borderGlow: "group-hover:border-red-500/50 group-hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]",
      icon: ShanksClawMarks
    },
    {
      id: "enigma",
      name: "ENIGMA OTE",
      type: "MACHINE LEARNING",
      vibe: "Spatial Recon | Cipher BPR Anomalies",
      desc: t.bots.enigma,
      image: "/images/enigma_mode.webp",
      accent: "text-emerald-400",
      borderGlow: "group-hover:border-emerald-500/50 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]",
      icon: Radar
    },
    {
      id: "klasik",
      name: "KLASIK EA",
      type: "QUANTITATIVE ALGO",
      vibe: "Logic Martingale & Hedging Grid",
      desc: t.bots.klasik,
      image: "/images/common_bot_mode.webp",
      accent: "text-blue-500",
      borderGlow: "group-hover:border-blue-500/50 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]",
      icon: Cpu
    }
  ];

  return (
    // Menggunakan background transparan agar menyatu dengan global layout Anda
    <div className="relative min-h-[calc(100vh-80px)] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* BACKGROUND PARTIKEL & GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* LANGUAGE TOGGLE FLOATING */}
      <div className="absolute top-6 right-6 z-50 flex items-center bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-lg shadow-lg">
        <Globe size={14} className="text-slate-400 ml-2 mr-1" />
        <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>EN</button>
        <button onClick={() => setLang('id')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'id' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>ID</button>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-8 mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
             <Activity size={12} className="animate-pulse" /> {t.live_node}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
            {t.title_1} <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              {t.title_2}
            </span>
          </h1>
          
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            {t.description}
          </p>

          <div className="pt-8">
            <Link href="/dashboard">
              <button className="group relative px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                  {t.btn_enter} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* ARSENAL GRID SECTION */}
        <div className="space-y-4 mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end">
           <div>
             <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3 justify-center md:justify-start">
               <Zap className="text-blue-500" /> {t.arsenal_title}
             </h2>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{t.arsenal_sub}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {botArsenal.map((bot) => (
            <div key={bot.id} className={`group relative h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] transition-all duration-500 ${bot.borderGlow}`}>
              
              {/* Gambar Background */}
              <div className="absolute inset-0 z-0">
                <Image 
                  src={bot.image} 
                  alt={bot.name}
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-40 group-hover:opacity-60 transition-opacity duration-700 group-hover:scale-110"
                />
                {/* Gradient Hitam untuk membaca teks */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
              </div>

              {/* Konten Kartu */}
              <div className="relative z-10 h-full flex flex-col justify-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  
                  <div className={`w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-4 ${bot.accent}`}>
                    <bot.icon size={20} />
                  </div>
                  
                  <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">{bot.type}</p>
                  <h3 className={`text-xl font-black uppercase tracking-tight mb-1 ${bot.accent}`}>{bot.name}</h3>
                  <p className="text-[10px] font-mono text-slate-300 mb-4">{bot.vibe}</p>
                  
                  {/* Deskripsi tersembunyi yang muncul saat hover */}
                  <div className="opacity-0 group-hover:opacity-100 h-0 group-hover:h-auto overflow-hidden transition-all duration-500 delay-100">
                    <p className="text-xs text-slate-400 leading-relaxed border-t border-white/10 pt-4 mt-2">
                      {bot.desc}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}