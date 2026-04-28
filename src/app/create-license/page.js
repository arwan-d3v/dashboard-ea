"use client";
import { useState } from "react";
import { ShieldCheck, KeyRound, Server, User, CalendarDays, CheckCircle2, Mail, Send, Phone, Tag, Clock } from "lucide-react";
import { db } from "../../lib/firebase";
import { ref, push, set } from "firebase/database";

export default function CreateLicense() {
  // ROLE SIMULATOR (Untuk Testing)
  const [currentUserRole, setCurrentUserRole] = useState("owner"); // "admin" atau "owner"

  const [formData, setFormData] = useState({
    investorName: "",
    email: "",
    telegram: "",
    whatsapp: "",
    accountNumber: "",
    brokerServer: "",
    durationMonths: "1",
    discountType: "NONE", // NONE, IB_30, MANUAL
    manualDiscountValue: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'pending' | 'approved', data: ... }

  // FUNGSI KRIPTOGRAFI SHA-256 (Berjalan jika di-Approve)
  const generateHash = async (account, broker, createdAt, expiredAt) => {
    const rawString = `${account}|${broker}|${createdAt}|${expiredAt}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    return `KRX-${hashHex.substring(0, 4)}-${hashHex.substring(4, 8)}-${hashHex.substring(8, 13)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const createdAt = Date.now();
      const durationMs = parseInt(formData.durationMonths) * 30 * 24 * 60 * 60 * 1000;
      const expiredAt = createdAt + durationMs;

      // Hitung Diskon
      let finalDiscount = 0;
      if (formData.discountType === "IB_30") finalDiscount = 30;
      else if (formData.discountType === "MANUAL" && currentUserRole === "owner") {
        finalDiscount = parseInt(formData.manualDiscountValue) || 0;
      }

      // Payload Data Registrasi
      const registrationData = {
        ...formData,
        finalDiscountPercent: finalDiscount,
        createdAt: createdAt.toString(),
        expiredAt: expiredAt.toString(),
        submittedBy: currentUserRole,
        status: currentUserRole === "owner" ? "APPROVED" : "PENDING_APPROVAL" // Admin selalu Pending
      };

      if (currentUserRole === "admin") {
        // ADMIN FLOW -> Masuk ke Waiting List (Pending Registrations)
        const pendingRef = ref(db, 'pending_registrations');
        await push(pendingRef, registrationData);
        
        setSubmitStatus({
          type: 'pending',
          message: `Pendaftaran akun ${formData.accountNumber} berhasil diajukan. Menunggu persetujuan Owner.`
        });

      } else {
        // OWNER FLOW -> Bisa langsung Auto-Approve & Generate License
        const newLicenseKey = await generateHash(formData.accountNumber, formData.brokerServer, createdAt, expiredAt);
        
        // Simpan ke daftar lisensi aktif
        const licenseRef = ref(db, `licenses/${formData.accountNumber}`);
        await set(licenseRef, {
          license_key: newLicenseKey,
          investor_name: formData.investorName,
          email: formData.email,
          telegram: formData.telegram,
          whatsapp: formData.whatsapp,
          broker_server: formData.brokerServer,
          status: "ACTIVE",
          expiry_date: expiredAt.toString(),
          last_heartbeat: createdAt.toString(),
          discount_applied: finalDiscount
        });

        setSubmitStatus({
          type: 'approved',
          key: newLicenseKey,
          account: formData.accountNumber
        });
      }
      
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 md:p-10 space-y-6 transition-colors duration-300 max-w-5xl mx-auto">
      
      {/* HEADER & ROLE SIMULATOR */}
      <div className="style-card flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[var(--primary)]/10 p-4 rounded-full text-[var(--primary)]">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Registrasi Investor</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Formulir pendaftaran lisensi EA KiroiX dengan sistem Approval.</p>
          </div>
        </div>

        {/* TOGGLE ROLE (UNTUK UJI COBA) */}
        <div className="bg-[var(--muted)] p-2 rounded-xl border border-[var(--card-border)] flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--muted-foreground)] ml-2">SIMULATOR LOGIN:</span>
          <button 
            onClick={() => setCurrentUserRole("admin")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentUserRole === "admin" ? "bg-white dark:bg-gray-800 text-blue-500 shadow" : "text-gray-500 hover:text-gray-700"}`}
          >
            Admin
          </button>
          <button 
            onClick={() => setCurrentUserRole("owner")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentUserRole === "owner" ? "bg-[var(--primary)] text-white shadow" : "text-gray-500 hover:text-gray-700"}`}
          >
            Owner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM SECTION (Takes 2 columns) */}
        <div className="lg:col-span-2 style-table-container p-6 md:p-8">
          <h3 className="font-bold text-lg text-[var(--foreground)] mb-6 border-b border-[var(--card-border)] pb-4">
            Data Pribadi & Trading
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* BARIS 1: Nama & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                  <User size={16}/> Nama Investor
                </label>
                <input type="text" required value={formData.investorName} onChange={(e) => setFormData({...formData, investorName: e.target.value})} placeholder="Nama Lengkap" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                  <Mail size={16}/> Email
                </label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@domain.com" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
            </div>

            {/* BARIS 2: Telegram & WA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                  <Send size={16}/> ID Telegram (Opsional)
                </label>
                <input type="text" value={formData.telegram} onChange={(e) => setFormData({...formData, telegram: e.target.value})} placeholder="@username" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                  <Phone size={16}/> No. WhatsApp (Opsional)
                </label>
                <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} placeholder="+628..." className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
            </div>

            <div className="h-px w-full bg-[var(--card-border)] my-6"></div>

            {/* BARIS 3: MT5 & Broker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                  <KeyRound size={16}/> Nomor Akun Trade (MT5)
                </label>
                <input type="number" required value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} placeholder="Contoh: 12345678" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                  <Server size={16}/> Server Broker
                </label>
                <input type="text" required value={formData.brokerServer} onChange={(e) => setFormData({...formData, brokerServer: e.target.value})} placeholder="Contoh: Exness-MT5Trial6" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
            </div>

            {/* BARIS 4: Durasi & Diskon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-[var(--muted)] p-5 rounded-xl border border-[var(--card-border)]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                  <CalendarDays size={16}/> Masa Berlaku
                </label>
                <select value={formData.durationMonths} onChange={(e) => setFormData({...formData, durationMonths: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none">
                  <option value="1">1 Bulan</option>
                  <option value="2">2 Bulan</option>
                  <option value="3">3 Bulan</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                  <Tag size={16}/> Program Diskon
                </label>
                <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none">
                  <option value="NONE">Harga Normal (Tanpa Diskon)</option>
                  <option value="IB_30">Under IB (-30%)</option>
                  <option value="MANUAL" disabled={currentUserRole !== "owner"}>Manual Diskon (Owner Only)</option>
                </select>
              </div>

              {/* MANUAL DISCOUNT (Hanya Aktif Jika Owner & Manual Dipilih) */}
              <div className={`space-y-2 transition-opacity ${formData.discountType === "MANUAL" ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">Custom Diskon (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={formData.manualDiscountValue} onChange={(e) => setFormData({...formData, manualDiscountValue: e.target.value})} placeholder="Cth: 50" disabled={formData.discountType !== "MANUAL" || currentUserRole !== "owner"} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 pr-8 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                  <span className="absolute right-4 top-3.5 text-[var(--muted-foreground)] font-bold">%</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-70 disabled:scale-100 flex justify-center items-center gap-2 text-lg">
              {isLoading ? "Memproses..." : (currentUserRole === "owner" ? "Approve & Generate License" : "Kirim Pengajuan (Pending)")}
            </button>
          </form>
        </div>

        {/* STATUS/RESULT SECTION (Takes 1 column) */}
        <div className="style-table-container p-6 bg-gradient-to-br from-[var(--card-bg)] to-[var(--muted)] flex flex-col items-center text-center">
          <h3 className="font-bold text-lg text-[var(--foreground)] mb-6 w-full border-b border-[var(--card-border)] pb-4">
            Status Pengajuan
          </h3>
          
          <div className="flex-grow flex flex-col justify-center w-full">
            {!submitStatus ? (
              <div className="opacity-50 space-y-4">
                <Clock size={48} className="mx-auto text-[var(--muted-foreground)]" />
                <p className="text-[var(--muted-foreground)] text-sm">Pilih mode <strong>Admin</strong> atau <strong>Owner</strong> di atas, lalu isi formulir untuk melihat alur sistem.</p>
              </div>
            ) : submitStatus.type === 'pending' ? (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 p-4 rounded-full inline-block mb-2">
                  <Clock size={40} />
                </div>
                <h4 className="text-xl font-bold text-[var(--foreground)]">Menunggu Approval</h4>
                <p className="text-[var(--muted-foreground)] text-sm px-4">{submitStatus.message}</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-[var(--active-green-bg)] text-[var(--active-green)] p-4 rounded-full inline-block mb-2">
                  <CheckCircle2 size={40} />
                </div>
                <h4 className="text-xl font-bold text-[var(--foreground)]">Lisensi Aktif!</h4>
                <p className="text-[var(--muted-foreground)] text-sm">Tersimpan di Firebase.</p>
                
                <div className="w-full bg-[var(--background)] border-2 border-[var(--primary)] rounded-xl p-4 mt-4 shadow-inner">
                  <p className="text-xs text-[var(--muted-foreground)] font-bold uppercase mb-1">License Key</p>
                  <p className="text-lg font-mono font-bold text-[var(--primary)]">{submitStatus.key}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}