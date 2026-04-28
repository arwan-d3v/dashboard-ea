"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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

  // Logika Route Protection (Proteksi Halaman)
  useEffect(() => {
    if (!loading) {
      // Jika belum login dan bukan di halaman login, lempar ke /login
      if (!user && pathname !== '/login') {
        router.push('/login');
      } 
      // Jika sudah login tapi mencoba ke halaman login, lempar ke dashboard (/)
      else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f111a]">
           <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="mt-4 font-bold text-slate-500">Memverifikasi Sesi...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};