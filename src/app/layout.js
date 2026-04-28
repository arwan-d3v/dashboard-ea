"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Key, ShieldCheck, BarChart, 
  AlertCircle, LogOut, UserPlus 
} from "lucide-react";

// Import AuthProvider & Firebase Auth
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

const inter = Inter({ subsets: ["latin"] });

// Komponen Navbar yang Dinamis berdasarkan Role
function AppNavbar() {
  const pathname = usePathname();
  const { user, role } = useAuth();

  // Sembunyikan Navbar jika sedang di halaman Login
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
      await signOut(auth);
    }
  };

  return (
    <nav className="bg-white dark:bg-[#1e2330] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs">KRX</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-white hidden sm:block tracking-tight">
              PRO'V17 <span className="font-normal text-slate-500">MONITORING</span>
            </span>
          </div>

          {/* Menu Navigasi - Tampil sesuai Role */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Menu Umum (Bisa dilihat Investor & Admin) */}
            <Link href="/" className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${pathname === '/' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white'}`}>
              <LayoutDashboard size={16}/> <span className="hidden md:inline">Dashboard</span>
            </Link>
            
            <Link href="/analytics" className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${pathname === '/analytics' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white'}`}>
              <BarChart size={16}/> <span className="hidden md:inline">Analytics</span>
            </Link>

            {/* Menu Khusus ADMIN & SUPER ADMIN */}
            {(role === 'admin' || role === 'super_admin') && (
              <>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                
                <Link href="/create-license" className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-500 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white transition">
                  <Key size={16}/> <span className="hidden md:inline">License</span>
                </Link>

                <Link href="/license-manager" className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-500 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white transition">
                  <ShieldCheck size={16}/> <span className="hidden md:inline">Manager</span>
                </Link>

                <Link href="/approval-center" className="px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 flex items-center gap-1.5 border border-orange-200 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition">
                  <AlertCircle size={16}/> <span className="hidden md:inline">Approval</span>
                </Link>
              </>
            )}

            {/* Menu Eksklusif SUPER ADMIN (Untuk mendaftarkan user baru) */}
            {role === 'super_admin' && (
              <Link href="/user-management" className="px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 flex items-center gap-1.5 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition ml-1">
                <UserPlus size={16}/> <span className="hidden md:inline">Users</span>
              </Link>
            )}

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            
            {/* Tombol Logout */}
            <button onClick={handleLogout} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Logout">
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
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-slate-200`}>
        {/* Bungkus seluruh aplikasi dengan AuthProvider */}
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