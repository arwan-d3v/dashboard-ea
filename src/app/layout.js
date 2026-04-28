import "./globals.css";
// PERBAIKAN: Menambahkan ShieldCheck ke dalam daftar import
import { Settings, LogOut, LayoutDashboard, Key, ShieldCheck, BarChart } from "lucide-react"; 
import { ThemeProvider } from "next-themes";
import ThemeToggle from "../components/ThemeToggle";
import Link from "next/link"; 

export const metadata = {
  title: "KRX-PRO'V17 Dashboard Monitoring",
  description: "Real-time Investor Dashboard by Arwan-D3v",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased font-sans transition-colors duration-300">
        
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div className="flex flex-col min-h-screen">
            
            <nav className="bg-[var(--nav-bg)] border-b border-[var(--card-border)] px-4 md:px-8 py-3.5 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="bg-[var(--primary)] p-2.5 rounded-xl shadow-inner">
                  <LayoutDashboard size={18} className="text-[var(--primary-foreground)]" />
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)] tracking-wide">
                  KRX <span className="font-light text-[var(--muted-foreground)] hidden sm:inline"> | PRO'V17 MONITORING</span>
                </h1>
              </div>
              
              <div className="flex gap-2 sm:gap-3 items-center">
                
                <Link href="/" className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition">
                  Dashboard
                </Link>
                
                {/* Menu License (Admin/Owner) */}
                <Link href="/create-license" className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted-foreground)] flex items-center gap-1.5 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition">
                  <Key size={16}/> <span className="hidden sm:inline">License</span>
                </Link>

                {/* TAMBAHAN MENU ANALYTICS */}
                <Link href="/analytics" className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted-foreground)] flex items-center gap-1.5 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition">
                   <BarChart size={16}/> <span className="hidden sm:inline">Analytics</span>
                </Link>

                {/* Menu Manager (Manajemen Lisensi Aktif) - TAMBAHAN BARU */}
                <Link href="/license-manager" className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--muted-foreground)] flex items-center gap-1.5 hover:text-[var(--primary)] transition">
                  <ShieldCheck size={16}/> <span className="hidden sm:inline">Manager</span>
                </Link>
                
                {/* Menu Approval Khusus Owner */}
                <Link href="/approval-center" className="relative px-3 py-2 text-sm font-medium rounded-lg bg-orange-500/10 text-orange-600 flex items-center gap-1.5 hover:bg-orange-500/20 transition border border-orange-500/20">
                  <ShieldCheck size={16}/> 
                  <span className="hidden sm:inline">Approval</span>
                </Link>

                <div className="h-6 w-px bg-[var(--card-border)] mx-1"></div>

                <ThemeToggle />
                
                <button className="p-2.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition hidden sm:block">
                  <Settings size={20}/>
                </button>
                <button className="p-2.5 text-red-500 hover:text-red-400 transition bg-red-500/10 rounded-xl border border-red-500/20">
                  <LogOut size={20}/>
                </button>
              </div>
            </nav>

            <main className="flex-grow max-w-7xl mx-auto w-full pb-10">
              {children}
            </main>
            
          </div>
        </ThemeProvider>
        
      </body>
    </html>
  );
}