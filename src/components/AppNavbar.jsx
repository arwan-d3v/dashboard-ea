"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  BarChart, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  UserPlus, 
  Cpu, 
  LogOut, 
  Sun, 
  Moon 
} from "lucide-react";

// ✅ Path yang benar sesuai struktur project Anda
import { useAuth } from "../app/context/AuthContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function AppNavbar() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  
  const [isDark, setIsDark] = useState(true);

  // Theme Handler
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDarkMode = savedTheme === "dark" || !savedTheme; // default dark

    setIsDark(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  return (
    <nav className="bg-[var(--card-bg)] border-b border-[var(--card-border)] sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm tracking-tighter">KRX</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">
                DASHBOARD EA
              </span>
              <p className="text-[10px] text-[var(--muted-foreground)] -mt-1">MONITORING SYSTEM</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <NavLink href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" pathname={pathname} />
            <NavLink href="/analytics" icon={<BarChart size={18} />} label="Analytics" pathname={pathname} />

            {(role === "admin" || role === "super_admin") && (
              <>
                <div className="w-px h-6 bg-[var(--card-border)] mx-2" />
                <NavLink href="/create-license" icon={<Key size={18} />} label="License" pathname={pathname} />
                <NavLink href="/license-manager" icon={<ShieldCheck size={18} />} label="Manager" pathname={pathname} />
              </>
            )}

            {role === "super_admin" && (
              <>
                <NavLink 
                  href="/approval-center" 
                  icon={<AlertCircle size={18} />} 
                  label="Approval" 
                  pathname={pathname}
                  highlight 
                />
                <NavLink 
                  href="/user-management" 
                  icon={<UserPlus size={18} />} 
                  label="Users" 
                  pathname={pathname}
                  highlight 
                />
                <NavLink 
                  href="/ea-manager" 
                  icon={<Cpu size={18} />} 
                  label="EA Control" 
                  pathname={pathname}
                  highlight 
                />
              </>
            )}

            <div className="w-px h-6 bg-[var(--card-border)] mx-2" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-[var(--muted)] transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Reusable NavLink Component
function NavLink({ href, icon, label, pathname, highlight = false }) {
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2 transition-all ${
        isActive 
          ? highlight 
            ? "bg-orange-500 text-white shadow-md" 
            : "bg-[var(--muted)] text-[var(--primary)]" 
          : highlight
            ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
            : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}