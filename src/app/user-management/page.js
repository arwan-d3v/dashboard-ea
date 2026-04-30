"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db, firebaseConfig } from "../../lib/firebase"; // Import firebaseConfig
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, set, onValue, remove } from "firebase/database";
import { UserPlus, Shield, User, Trash2, Mail, Lock, ShieldCheck } from "lucide-react";

export default function UserManagement() {
  const { role } = useAuth();
  const [users, setUsers] = useState({});
  const [formData, setForm] = useState({ email: "", role: "investor", password: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (role === 'super_admin') {
      const usersRef = ref(db, 'users');
      const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          setUsers(snapshot.val());
        } else {
          setUsers({});
        }
      });
      return () => unsubscribe();
    }
  }, [role]);

  if (role !== 'super_admin') {
    return <div className="flex h-[80vh] items-center justify-center font-bold text-red-500 text-xl">Akses Ditolak</div>;
  }

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMsg({ type: "", text: "" });

    try {
      // 1. Buat "Shadow App" untuk mendaftarkan user tanpa melogout Super Admin
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Daftarkan ke Firebase Authentication!
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.password
      );
      
      const newUid = userCredential.user.uid; // Dapatkan UID Asli dari sistem

      // 3. Simpan Role & Data ke Realtime Database pakai UID Asli
      await set(ref(db, `users/${newUid}`), {
        email: formData.email.toLowerCase(),
        role: formData.role,
        createdAt: new Date().toISOString()
      });

      // 4. Logout dan matikan Shadow App
      await signOut(secondaryAuth);

      setMsg({ type: "success", text: "User berhasil didaftarkan dan siap untuk Login!" });
      setForm({ email: "", role: "investor", password: "" });
      
    } catch (error) {
      console.error(error);
      // Tangani error Firebase (misal: password kurang dari 6 karakter, email sudah ada)
      if (error.code === 'auth/email-already-in-use') {
        setMsg({ type: "error", text: "Gagal: Email sudah terdaftar di sistem!" });
      } else if (error.code === 'auth/weak-password') {
        setMsg({ type: "error", text: "Gagal: Password minimal 6 karakter!" });
      } else {
        setMsg({ type: "error", text: "Gagal menambahkan user. Periksa koneksi." });
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => setMsg({ type: "", text: "" }), 5000);
    }
  };

  const handleDeleteUser = async (uid) => {
    if(confirm("PERINGATAN: Hapus user ini dari Database? (User mungkin masih bisa login namun tidak punya Role)")) {
      await remove(ref(db, `users/${uid}`));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* HEADER */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] p-6 md:p-8 shadow-sm flex items-center gap-5">
        <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-500 shadow-inner"><ShieldCheck size={36}/></div>
        <div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">System Access Manager</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Kelola role dan hak akses untuk Admin dan Investor.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM TAMBAH USER BARU */}
        <div className="lg:col-span-1 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] p-6 md:p-8 shadow-sm h-fit">
          <h2 className="text-lg font-black text-[var(--foreground)] mb-6 flex items-center gap-2">
            <UserPlus className="text-purple-500" size={20}/> Daftarkan User Baru
          </h2>

          {msg.text && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-bold ${msg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleRegisterUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-[var(--muted-foreground)] opacity-70" size={16} />
                <input type="email" required value={formData.email} onChange={(e) => setForm({...formData, email: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple-500" placeholder="investor@mail.com"/>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Password Akun (Min. 6 Karakter)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-[var(--muted-foreground)] opacity-70" size={16} />
                <input type="text" required minLength="6" value={formData.password} onChange={(e) => setForm({...formData, password: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Minimal 6 karakter"/>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Hak Akses (Role)</label>
              <select value={formData.role} onChange={(e) => setForm({...formData, role: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-sm rounded-xl px-4 py-3 outline-none cursor-pointer">
                <option value="investor">Investor (Lihat Dashboard Saja)</option>
                <option value="admin">Admin (Bisa Kelola License)</option>
              </select>
            </div>

            <button type="submit" disabled={isProcessing} className="w-full bg-purple-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-all mt-4 flex justify-center items-center gap-2">
              {isProcessing ? 'Mendaftarkan ke Server...' : 'Tambahkan Akses'}
            </button>
          </form>
        </div>

        {/* TABEL DAFTAR USER */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-[var(--card-border)]">
             <h2 className="text-lg font-black text-[var(--foreground)]">Daftar Akun Terdaftar</h2>
          </div>
          
          <div className="overflow-x-auto w-full custom-scrollbar flex-grow p-6">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="pb-3 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider pl-2">Informasi Akun</th>
                  <th className="pb-3 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Role</th>
                  <th className="pb-3 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {Object.keys(users).map((uid) => (
                  <tr key={uid} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${users[uid].role === 'super_admin' ? 'bg-amber-500' : users[uid].role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                          {users[uid].email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--foreground)]">{users[uid].email}</div>
                          <div className="text-[10px] text-[var(--muted-foreground)] uppercase mt-0.5 tracking-wider">UID: {uid.substring(0,8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        users[uid].role === 'super_admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        users[uid].role === 'admin' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {users[uid].role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                       {users[uid].role !== 'super_admin' && (
                         <button onClick={() => handleDeleteUser(uid)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                           <Trash2 size={16}/>
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}