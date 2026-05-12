"use client";

import { usePathname } from "next/navigation";
import AppNavbar from "./AppNavbar";

export default function ClientLayoutWrapper({ children }) {
  const pathname = usePathname();

  // Daftar rute publik yang TIDAK BOLEH ada Header Global (Navbar)
  const isPublicPage = pathname === "/" || pathname === "/login";

  return (
    <>
      {/* Jika BUKAN halaman publik, tampilkan AppNavbar */}
      {!isPublicPage && <AppNavbar />}
      
      {/* Sesuaikan tinggi layar jika ada navbar vs tidak ada navbar */}
      <main className={!isPublicPage ? "min-h-[calc(100vh-4rem)]" : "min-h-screen"}>
        {children}
      </main>
    </>
  );
}