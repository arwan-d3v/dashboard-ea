"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Cek Role user dari Realtime Database
        const roleRef = ref(db, `users/${currentUser.uid}/role`);
        const snapshot = await get(roleRef);
        if (snapshot.exists()) {
          setRole(snapshot.val());
        } else {
          setRole('investor'); // Default jika tidak ada data
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ====================================================================
  // ❌ LOGIKA ROUTER & REDIRECT DIHAPUS DARI SINI ❌
  // Tugas menendang user sekarang 100% dilakukan oleh dashboard/page.js
  // AuthContext sekarang murni hanya bertugas menyimpan status sesi user
  // ====================================================================

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#030712]">
           <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="mt-4 font-bold text-slate-500 text-xs tracking-widest uppercase">Memverifikasi Sesi Sistem...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};