"use client";
import { useState, useEffect } from "react";
// PERBAIKAN: Menambahkan KeyRound di import
import { ShieldCheck, CheckCircle, XCircle, User, Server, Clock, Tag, Search, AlertCircle, KeyRound } from "lucide-react";
import { db } from "../../lib/firebase";
import { ref, onValue, set, remove } from "firebase/database";

export default function ApprovalCenter() {
  const [pendingList, setPendingList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const pendingRef = ref(db, 'pending_registrations');
    const unsubscribe = onValue(pendingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPendingList(list);
      } else {
        setPendingList([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    if (!confirm(`Approve pendaftaran untuk ${item.investorName}?`)) return;
    setProcessingId(item.id);

    try {
      const licenseKey = await generateHash(
        item.accountNumber, 
        item.brokerServer, 
        item.createdAt, 
        item.expiredAt
      );

      const licenseRef = ref(db, `licenses/${item.accountNumber}`);
      await set(licenseRef, {
        license_key: licenseKey,
        investor_name: item.investorName,
        email: item.email,
        telegram: item.telegram,
        whatsapp: item.whatsapp,
        broker_server: item.brokerServer,
        status: "ACTIVE",
        expiry_date: item.expiredAt,
        last_heartbeat: Date.now().toString(),
        discount_applied: item.finalDiscountPercent,
        approved_at: Date.now().toString()
      });

      const pendingItemRef = ref(db, `pending_registrations/${item.id}`);
      await remove(pendingItemRef);

      alert("Lisensi berhasil diaktifkan dan dikirim ke database utama!");
    } catch (error) {
      console.error("Error approving:", error);
      alert("Gagal melakukan approval.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item) => {
    if (!confirm(`Tolak pendaftaran untuk ${item.investorName}? Data akan dihapus.`)) return;
    setProcessingId(item.id);

    try {
      const pendingItemRef = ref(db, `pending_registrations/${item.id}`);
      await remove(pendingItemRef);
    } catch (error) {
      alert("Gagal menghapus data.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-5 md:p-10 space-y-8 max-w-6xl mx-auto">
      <div className="style-card justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500/10 p-4 rounded-full text-orange-500">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Approval Center</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Verifikasi pendaftaran investor dari para Admin.</p>
          </div>
        </div>
        <div className="hidden md:flex bg-[var(--muted)] px-4 py-2 rounded-xl border border-[var(--card-border)] items-center gap-2">
          <Clock size={16} className="text-[var(--primary)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">{pendingList.length} Antrean Tertunda</span>
        </div>
      </div>

      <div className="style-table-container">
        <div className="style-table-header flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Search size={18} className="text-[var(--primary)]" />
            Daftar Tunggu Persetujuan
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--muted)]/50">
                <th className="p-4 text-xs font-bold uppercase text-[var(--muted-foreground)]">Investor</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--muted-foreground)]">Akun & Broker</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--muted-foreground)]">Durasi & Diskon</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--muted-foreground)] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-[var(--muted-foreground)]">Memuat antrean...</td>
                </tr>
              ) : pendingList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center space-y-3">
                    <AlertCircle size={48} className="mx-auto opacity-20" />
                    <p className="text-[var(--muted-foreground)]">Tidak ada pendaftaran yang menunggu persetujuan.</p>
                  </td>
                </tr>
              ) : (
                pendingList.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--card-border)] hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--foreground)]">{item.investorName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{item.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm font-mono text-[var(--primary)] font-bold">
                        <KeyRound size={14}/> {item.accountNumber}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-1">
                        <Server size={14}/> {item.brokerServer}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-[var(--foreground)] font-medium">{item.durationMonths} Bulan</div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold mt-1 uppercase">
                        <Tag size={10}/> Diskon: {item.finalDiscountPercent}%
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleReject(item)}
                        disabled={processingId === item.id}
                        className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Tolak"
                      >
                        <XCircle size={22} />
                      </button>
                      <button 
                        onClick={() => handleApprove(item)}
                        disabled={processingId === item.id}
                        className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-all inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        {processingId === item.id ? "Processing..." : (
                          <>
                            <CheckCircle size={18} /> Approve
                          </>
                        )}
                      </button>
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