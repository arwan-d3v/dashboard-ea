"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get, set } from "firebase/database";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Kredensial Hardcode untuk Super Admin
  const SUPER_ADMIN_EMAIL = "admin@krx.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Proses Login ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Tentukan Role secara mutlak (Anti Huruf Besar/Kecil)
      let finalRole = "investor"; 
      if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        finalRole = "super_admin";
      }

      // 3. Cek di Realtime Database
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      // 4. LOGIKA SUPER PENTING: Paksa update jika dia super_admin ATAU user baru
      if (!snapshot.exists() || finalRole === "super_admin") {
        await set(userRef, {
          email: user.email,
          role: finalRole,
          lastLogin: new Date().toISOString()
        });
      }

      // 5. Arahkan ke Dashboard
      router.push("/");
      
    } catch (err) {
      console.error(err);
      setError("Email atau Password salah. Silakan periksa kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 transition-colors duration-300">
      
      {/* Container Form Login */}
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-[2rem] p-8 md:p-10 border border-[var(--card-border)] shadow-xl relative z-10">
        
        {/* Header Login */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[var(--primary)] rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3">
            <span className="text-2xl font-black text-white -rotate-3">KRX</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Sign in to access your KiroiX Enterprise dashboard.
          </p>
        </div>

        {/* Notifikasi Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-bold text-red-500">{error}</p>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-[var(--muted-foreground)] opacity-70" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@krx.com"
                className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-sm font-bold rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all placeholder:font-normal placeholder:text-[var(--muted-foreground)] placeholder:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-[var(--muted-foreground)] opacity-70" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-sm font-bold rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)] placeholder:opacity-50"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[var(--primary)] hover:opacity-90 text-white font-bold text-sm rounded-xl py-3.5 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}