"use client";

import { usePathname } from "next/navigation";
import AppNavbar from "./AppNavbar";

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

      {/* FOOTER GLOBAL - FROM DEV TEAM */}
      <footer className="w-full bg-[#050505] border-t border-white/5 py-6 px-4 z-50 text-center flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] sm:text-xs text-slate-500 font-mono font-bold uppercase tracking-widest">
          From Deep Peace Arwan KRX - dev team's | Official partner With Delta Growth Capitals™
        </p>
      </footer>
    </div>
  );
}