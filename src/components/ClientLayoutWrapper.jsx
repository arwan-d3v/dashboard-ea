"use client";

import { usePathname } from "next/navigation";
import AppNavbar from "./AppNavbar";
import { Globe } from "lucide-react";

export default function ClientLayoutWrapper({ children }) {
  const pathname = usePathname();

  // Daftar rute publik yang TIDAK BOLEH ada Header Global (Navbar)
  const isPublicPage = pathname === "/" || pathname === "/login";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Jika BUKAN halaman publik, tampilkan AppNavbar */}
      {!isPublicPage && <AppNavbar />}
      
      {/* Area Utama Konten */}
      <main className={`flex-grow ${!isPublicPage ? "min-h-[calc(100vh-4rem)]" : ""}`}>
        {children}
      </main>

      {/* FOOTER GLOBAL - ELITE MINIMALIST */}
      <footer className="w-full bg-[#050505] border-t border-white/5 py-6 px-4 z-50 flex flex-col items-center justify-center gap-2 transition-colors">
        <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono flex flex-wrap items-center justify-center gap-x-2 gap-y-1 hover:text-slate-400 transition-colors text-center cursor-default">
          <span>&copy; 2026 KRX Quantitative Labs.</span>
          <span className="hidden sm:inline opacity-30">|</span>
          
          <span>
            Crafted by Arwan as <span className="font-bold text-slate-300">kiroi4X _ || འⱮ™</span>.
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          
          <span className="flex items-center justify-center gap-1">
            Backed by <Globe size={10} className="text-blue-500 animate-[spin_10s_linear_infinite]" /> <span className="font-bold text-slate-300">Delta Growth Capitals™</span>.
          </span>
        </div>
      </footer>
    </div>
  );
}