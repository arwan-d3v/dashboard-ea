import "./globals.css";
import { Settings, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "../components/ThemeToggle";

export const metadata = {
  title: "KRX-PRO'V17 Dashboard Monitoring",
  description: "Real-time Investor Dashboard by Arwan-D3v",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      {/* KITA PINDAHKAN WARNA DAN FONT KE SINI AGAR TAILWIND V4 BAHAGIA */}
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
              
              <div className="flex gap-3 items-center">
                <ThemeToggle />
                
                <button className="p-2.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition">
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