"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Mail, Loader2, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // === AUTO REDIRECT TO LANDING PAGE (5 MINUTES IDLE) ===
  // Jika diam di halaman login selama 5 menit (akumulasi 10 menit dari dashboard), tendang ke Lobi
  useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => router.push("/"), 300000); // 300,000 ms = 5 Menit
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      // FIX: Pesan Error/Warning Login diubah ke Bahasa Inggris
      setError("Access Denied: Invalid credentials or unrecognized node.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* TENTAKEL BACK BUTTON */}
      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors tracking-widest uppercase">
        <ArrowLeft size={16} /> Return to Dashboard
      </Link>

      {/* Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 bottom-0 m-auto h-[300px] w-[300px] rounded-full bg-blue-600 opacity-20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.1)] backdrop-blur-sm">
          
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <ShieldAlert className="text-blue-500" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">LOGIN AREA</h1>
            <p className="text-xs text-slate-500 font-mono mt-2 tracking-widest flex items-center gap-1">
              <Zap size={10} className="text-amber-500" /> KRX SECURITY PROTOCOL
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold p-3 rounded-lg mb-6 text-center animate-pulse uppercase tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">Node ID (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="admin@krx.com" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">Node Credential (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm tracking-widest uppercase rounded-xl py-3.5 mt-4 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50">
              {/* FIX: Loading status in English */}
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> AUTHENTICATING...</>
              ) : (
                <><Lock size={16}/> ESTABLISH CONNECTION</>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}