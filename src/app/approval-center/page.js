"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../../lib/firebase";
import { ref, onValue, set, remove } from "firebase/database";
import { ShieldAlert, CheckCircle, XCircle, Clock, KeyRound, Server, User, Tag, ShieldCheck } from "lucide-react";

export default function ApprovalCenter() {
  const { role, user } = useAuth();
  const [pendingList, setPendingList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (role === 'super_admin') {
      const pendingRef = ref(db, 'pending_registrations');
      const unsubscribe = onValue(pendingRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Ubah object firebase menjadi array agar mudah di-map
          const formattedData = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setPendingList(formattedData);
        } else {
          setPendingList([]);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [role]);

  // FUNGSI KRIPTOGRAFI SHA-256
  const generateHash = async (account, broker, createdAt, expiredAt) => {
    const rawString = `${account}|${broker}|${createdAt}|${expiredAt}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    return `KRX-${hashHex.substring(0, 4)}-${hashHex.substring(4, 8)}-${hashHex.substring(8, 13)}`;
  };

  const handleApprove = async (item) => {
    if (!confirm(`Setujui lisensi untuk akun ${item.account_number}?`)) return;
    setProcessingId(item.id);

    try {
      // 1. Generate Key Baru
      const newLicenseKey = await generateHash(item.account_number, item.broker_server, item.created_at, item.expired_at);
      
      // 2. Pindahkan ke node 'licenses' (Lisensi Aktif)
      const licenseRef = ref(db, `licenses/${item.account_number}`);
      await set(licenseRef, {
        license_key: newLicenseKey,
        investor_name: item.investor_name || "Unknown",
        email: item.email || "",
        telegram: item.telegram || "",
        whatsapp: item.whatsapp || "",
        broker_server: item.broker_server,
        status: "ACTIVE",
        expiry_date: item.expired_at,
        last_heartbeat: item.created_at,
        discount_applied: item.discount_applied || 0,
        requested_by: item.requested_by, // Admin yang mengajukan
        approved_by: user.email          // Super admin yang menyetujui
      });

      // 3. Hapus dari daftar antrean (pending_registrations)
      await remove(ref(db, `pending_registrations/${item.id}`));

    } catch (error) {
      console.error("Gagal menyetujui:", error);
      alert("Terjadi kesalahan sistem saat memproses approval.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, accountNumber) => {
    if (!confirm(`TOLAK dan HAPUS pengajuan untuk akun ${accountNumber}? Data tidak dapat dikembalikan.`)) return;
    setProcessingId(id);
    try {
      await remove(ref(db, `pending_registrations/${id}`));
    } catch (error) {
      console.error("Gagal menolak:", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (role !== 'super_admin') {
    return <div className="flex h-[80vh] items-center justify-center font-bold text-red-500 text-xl"><ShieldAlert className="mr-2"/> Akses Ditolak</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* HEADER */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 shadow-inner">
            <ShieldCheck size={36}/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Approval Center</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Verifikasi pendaftaran lisensi dari para Admin.</p>
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 px-5 py-3 rounded-2xl flex items-center gap-3">
          <Clock className="text-blue-500" size={20} />
          <span className="font-black text-blue-500">{pendingList.length} Antrean Tertunda</span>
        </div>
      </div>

      {/* TABEL LIST */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[var(--card-border)] bg-[var(--muted)]/30 flex items-center gap-2">
           <h2 className="text-lg font-black text-[var(--foreground)] tracking-tight">Daftar Tunggu Persetujuan</h2>
        </div>
        
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                <th className="py-4 px-6 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Data Investor</th>
                <th className="py-4 px-6 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Informasi Akun (MT5)</th>
                <th className="py-4 px-6 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Durasi & Diskon</th>
                <th className="py-4 px-6 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-right">Aksi Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-10 font-bold text-[var(--primary)] animate-pulse">Memuat Antrean...</td></tr>
              ) : pendingList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-16">
                    <CheckCircle size={48} className="mx-auto text-[#10b981]/50 mb-3" />
                    <p className="font-bold text-[var(--muted-foreground)]">Semua bersih! Tidak ada antrean lisensi saat ini.</p>
                  </td>
                </tr>
              ) : (
                pendingList.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    
                    {/* KOLOM 1: DATA INVESTOR */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[var(--foreground)] flex items-center gap-2">
                          <User size={14} className="text-[var(--primary)]"/> {item.investor_name || '-'}
                        </span>
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">{item.email}</span>
                        {/* BADGE PENGAJU (ADMIN) */}
                        <div className="mt-2 inline-flex">
                          <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-wider">
                            By Admin: {item.requested_by}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* KOLOM 2: AKUN & BROKER */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <KeyRound size={14} className="text-orange-500" />
                          <span className="font-black text-[var(--foreground)] tracking-tight">{item.account_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Server size={14} className="text-blue-500" />
                          <span className="text-xs font-bold text-[var(--muted-foreground)]">{item.broker_server}</span>
                        </div>
                      </div>
                    </td>

                    {/* KOLOM 3: DURASI & DISKON */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[var(--foreground)]" />
                          <span className="text-sm font-bold text-[var(--foreground)]">{item.duration_months} Bulan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-amber-500" />
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${item.discount_applied > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                            Diskon: {item.discount_applied}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* KOLOM 4: AKSI */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleReject(item.id, item.account_number)} 
                          disabled={processingId === item.id}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-30"
                          title="Tolak & Hapus"
                        >
                          <XCircle size={24} />
                        </button>
                        
                        <button 
                          onClick={() => handleApprove(item)} 
                          disabled={processingId === item.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          <CheckCircle size={16} />
                          {processingId === item.id ? 'Memproses...' : 'Approve'}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}