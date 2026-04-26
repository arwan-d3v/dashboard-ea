"use client";
import { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import { Wallet, TrendingUp, Activity, ShieldAlert, BarChart3, AlertCircle } from "lucide-react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  // Mencegah hydration error
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="p-5 md:p-10 space-y-8 transition-colors duration-300">
      
      {/* STATUS HEADER - STYLISH, PING ANIMATION */}
      <div className="style-card flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-all duration-300">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Ringkasan Akun Real</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Data dikirim real-time oleh KRX Expert Advisor di MT5</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[var(--active-green-bg)] px-5 py-2.5 rounded-full border border-[var(--active-green)]/20 shadow-inner">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--active-green)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--active-green)]"></span>
          </div>
          <span className="text-[var(--active-green)] text-sm font-bold tracking-wide">AKTIF</span>
        </div>
      </div>

      {/* STATS GRID (4 KOTAK) - STYLISH, GRADIENT INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Balance Saat Ini" 
          value="$10,540.20" 
          icon={Wallet} 
          colorClass="text-blue-500" 
          gradientBgClass="stat-bg-blue" 
        />
        <StatCard 
          title="Live Equity" 
          value="$10,610.50" 
          icon={TrendingUp} 
          colorClass="text-emerald-600" 
          gradientBgClass="stat-bg-emerald" 
          trend={+1.2}
        />
        <StatCard 
          title="Margin Level" 
          value="2,450%" 
          icon={Activity} 
          colorClass="text-purple-600" 
          gradientBgClass="stat-bg-purple" 
        />
        <StatCard 
          title="Max Drawdown" 
          value="1.2%" 
          icon={ShieldAlert} 
          colorClass="text-yellow-600" 
          gradientBgClass="stat-bg-yellow" 
        />
      </div>

      {/* AREA TABEL TRADING & GRAFIK (STYLISH) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABEL POSISI TERBUKA */}
        <div className="lg:col-span-2 style-table-container">
          <div className="style-table-header flex justify-between items-center p-5">
            <div className="flex gap-3 items-center">
                <BarChart3 className="text-[var(--primary)]"/>
                <h3 className="font-bold text-[var(--foreground)]">Posisi Terbuka (Open Trades)</h3>
            </div>
            <span className="bg-[var(--card-bg)] text-xs text-[var(--muted-foreground)] border border-[var(--card-border)] px-3 py-1 rounded-full shadow-inner">0 Trades</span>
          </div>
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
             <AlertCircle size={36} className="text-[var(--muted-foreground)] opacity-50"/>
             <p className="text-lg font-medium text-[var(--muted-foreground)]">Belum ada data transaksi.</p>
             <p className="text-sm text-[var(--muted-foreground)]/80 max-w-sm">
                Nanti kita akan integrasikan Firebase di sini agar tabel ini auto-update saat EA MT5 membuka posisi baru.
             </p>
          </div>
        </div>

        {/* SECTION TAMBAHAN STYLISH */}
        <div className="style-table-container lg:col-span-1 p-6 flex flex-col items-center justify-center text-center">
            <h4 className="font-bold text-[var(--foreground)]">Butuh Bantuan Teknis?</h4>
            <p className="text-sm text-[var(--muted-foreground)] mt-2 mb-5 max-w-xs">
                Dashboard ini dikelola secara modern dan gampang di-maintenance. Hubungi admin untuk konfigurasi lanjut.
            </p>
            <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-3 rounded-xl font-semibold shadow-lg hover:scale-105 hover:bg-blue-600 transition-all duration-300 w-full max-w-xs">
                Hubungi Support
            </button>
        </div>

      </div>

    </div>
  );
}