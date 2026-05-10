"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react"; 

// JADIKAN SATU BLOK IMPORT LUCIDE-REACT SEPERTI INI:
import { 
  LayoutDashboard, Key, ShieldCheck, BarChart, 
  AlertCircle, LogOut, UserPlus, Sun, Moon, Cpu 
} from "lucide-react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

const inter = Inter({ subsets: ["latin"] });

// ... (lanjutkan ke fungsi AppNavbar seperti biasa) ...

function AppNavbar() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  
  // State untuk Theme Toggle
  const [isDark, setIsDark] = useState(true);

  // Inisialisasi Tema saat halaman dimuat
  useEffect(() => {
    if (localStorage.getItem('theme') === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fungsi mengubah Tema
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
      await signOut(auth);
    }
  };

  return (
    <nav className="bg-[var(--card-bg)] border-b border-[var(--card-border)] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs">KRX</span>
            </div>
            <span className="font-bold text-[var(--foreground)] hidden sm:block tracking-tight">
              DASHBOARD |   
             <span className="font-normal text-[var(--muted-foreground)]"> MONITORING</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            
            <Link href="/" className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${pathname === '/' ? 'bg-[var(--muted)] text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'}`}>
              <LayoutDashboard size={16}/> <span className="hidden md:inline">Dashboard</span>
            </Link>
            
            <Link href="/analytics" className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${pathname === '/analytics' ? 'bg-[var(--muted)] text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'}`}>
              <BarChart size={16}/> <span className="hidden md:inline">Analytics</span>
            </Link>

          {/* HANYA ADMIN & SUPER ADMIN YANG BISA LIHAT INI */}
          {(role === 'admin' || role === 'super_admin') && (
            <>
              <div className="w-px h-6 bg-[var(--card-border)] mx-1 hidden sm:block"></div>
              
              {/* Admin HANYA BISA mengajukan (Create) dan melihat daftarnya (Manager) */}
              <Link href="/create-license" className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg text-[var(--muted-foreground)] flex items-center gap-1.5 hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition">
                <Key size={16}/> <span className="hidden md:inline">License</span>
              </Link>

              <Link href="/license-manager" className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg text-[var(--muted-foreground)] flex items-center gap-1.5 hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition">
                <ShieldCheck size={16}/> <span className="hidden md:inline">Manager</span>
              </Link>
            </>
          )}


          {/* HAK MUTLAK KHUSUS SUPER ADMIN */}
          {role === 'super_admin' && (
            <>
              {/* Super Admin BISA melakukan Approval Lisensi yang diajukan Admin */}
              <Link href="/approval-center" className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition ml-1 ${pathname === '/approval-center' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'}`}>
                <AlertCircle size={16}/> <span className="hidden md:inline">Approval</span>
              </Link>

              <Link href="/user-management" className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition ml-1 ${pathname === '/user-management' ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'}`}>
                <UserPlus size={16}/> <span className="hidden md:inline">Users</span>
              </Link>

              <Link href="/ea-manager" className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition ml-1 ${pathname === '/ea-manager' ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}>
                <Cpu size={16}/> <span className="hidden md:inline">EA Control</span>
              </Link>
            </>
          )}

            <div className="w-px h-6 bg-[var(--card-border)] mx-1"></div>
            
            {/* TOGGLE THEME BUTTON */}
            <button onClick={toggleTheme} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors" title="Toggle Light/Dark Mode">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* LOGOUT BUTTON */}
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Logout">
              <LogOut size={18} />
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)]`}>
        <AuthProvider>
          <AppNavbar />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}