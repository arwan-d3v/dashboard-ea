"use client";
import { useState, useEffect } from "react";
import { 
  Server, Cpu, Save, User, ShieldCheck, 
  Settings, Network, CheckCircle2, AlertCircle, ChevronDown 
} from "lucide-react";
import { db } from "../../lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";

export default function EaManager() {
  const { role } = useAuth();
  const [accounts, setAccounts] = useState({});
  const [accountIds, setAccountIds] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState("");
  
  const [formData, setFormData] = useState({
    investor_name: "",
    broker: "",
    bot_type: "NON_ML",
    vps_ip: "",
    ws_port: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); 

  // ==========================================
  // PERBAIKAN 1: FETCH DATA TANPA STALE CLOSURE
  // ==========================================
  useEffect(() => {
    const accountsRef = ref(db, 'account_data');
    const unsubscribe = onValue(accountsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAccounts(data);
        const ids = Object.keys(data);
        setAccountIds(ids);
        
        // Gunakan (prev) state agar React selalu melihat data dropdown terbaru
        // dan tidak me-reset paksa ke urutan pertama saat live data bergerak.
        setSelectedAcc((prev) => {
          if (!prev && ids.length > 0) return ids[0];
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // PERBAIKAN 2: UPDATE FORM HANYA SAAT AKUN BERUBAH
  // ==========================================
  useEffect(() => {
    if (selectedAcc && accounts[selectedAcc]) {
      const meta = accounts[selectedAcc].metadata || {};
      setFormData({
        investor_name: meta.investor_name || "",
        broker: meta.broker || "",
        bot_type: meta.bot_type || "NON_ML",
        vps_ip: meta.vps_ip || "",
        ws_port: meta.ws_port || ""
      });
      setSaveStatus(null);
    }
    // Kita SENGAJA tidak memasukkan 'accounts' ke dalam array di bawah ini.
    // Tujuannya agar form tidak menimpa/menghapus ketikan user saat live data MT5 berkedip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAcc]);

  // Fungsi Save ke Firebase
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const metaRef = ref(db, `account_data/${selectedAcc}/metadata`);
      await update(metaRef, formData);
      setSaveStatus('success');
      
      // Hilangkan pesan sukses setelah 3 detik
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Error saving metadata:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Batasi Akses (Hanya Super Admin)
  if (role === 'user') {
    return <div className="flex justify-center items-center h-[80vh] font-bold text-red-500 text-xl"><AlertCircle className="mr-2"/> Akses Ditolak</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto font-sans">
      
      {/* HEADER */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 shadow-inner border border-blue-500/20">
            <Cpu size={36}/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">EA Control Center</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Manajemen Node VPS & Konfigurasi Bot AI per Akun MT5.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: PEMILIHAN AKUN */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-[var(--muted-foreground)] uppercase tracking-widest flex items-center gap-2 mb-4">
              <User size={16} className="text-[var(--primary)]"/> Pilih Akun
            </h3>
            <div className="relative">
              <select 
                value={selectedAcc} 
                onChange={(e) => setSelectedAcc(e.target.value)}
                className="appearance-none w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-sm font-bold rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer shadow-inner"
              >
                {accountIds.length === 0 ? <option>Memuat data...</option> : null}
                {accountIds.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-3.5 text-[var(--muted-foreground)] pointer-events-none" />
            </div>

            {/* Mini Info Panel */}
            <div className="mt-6 p-4 bg-[var(--muted)]/50 rounded-2xl border border-[var(--card-border)]">
              <p className="text-xs text-[var(--muted-foreground)] font-bold mb-1">Status Lisensi</p>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500"/>
                <span className="text-sm font-black text-[var(--foreground)]">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: FORM KONFIGURASI */}
        <div className="md:col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <h3 className="text-lg font-black text-[var(--foreground)] flex items-center gap-2 mb-6 border-b border-[var(--card-border)] pb-4">
            <Settings size={20} className="text-[var(--primary)]"/> Konfigurasi Node Metadata
          </h3>

          <form onSubmit={handleSave} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama Investor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider pl-1">Nama Investor</label>
                <input type="text" value={formData.investor_name} onChange={(e) => setFormData({...formData, investor_name: e.target.value})} placeholder="Sultan Trading" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm font-bold text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
              
              {/* Server Broker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider pl-1">Server Broker</label>
                <input type="text" value={formData.broker} onChange={(e) => setFormData({...formData, broker: e.target.value})} placeholder="Exness-MT5Trial6" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm font-bold text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none" />
              </div>
            </div>

            <div className="h-px w-full bg-[var(--card-border)] my-6"></div>

            {/* Tipe Bot AI */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5"><Cpu size={14} className="text-[var(--primary)]"/> Algoritma EA (Bot Type)</label>
              <select value={formData.bot_type} onChange={(e) => setFormData({...formData, bot_type: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm font-black text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none cursor-pointer">
                <option value="NON_ML">🤖 Klasik EA (Tanpa AI Command Center)</option>
                <option value="GOD_MODE">👑 GOD MODE V3 (Port 5000)</option>
                <option value="BEAST_MODE">🔥 BEAST MODE V4 (Port 5001)</option>
                <option value="ENIGMA_OTE">👁️ ENIGMA OTE V5 (Port 5002)</option>
              </select>
            </div>

            {/* Setup Server Node */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl border transition-all duration-300 ${formData.bot_type === 'NON_ML' ? 'bg-[var(--muted)]/30 border-[var(--card-border)] opacity-50 grayscale' : 'bg-blue-500/5 border-blue-500/30'}`}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5"><Server size={14}/> IP Address VPS</label>
                <input type="text" disabled={formData.bot_type === 'NON_ML'} value={formData.vps_ip} onChange={(e) => setFormData({...formData, vps_ip: e.target.value})} placeholder="118.193.xx.xx" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm font-bold text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none disabled:cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5"><Network size={14}/> WebSocket Port</label>
                <input type="text" disabled={formData.bot_type === 'NON_ML'} value={formData.ws_port} onChange={(e) => setFormData({...formData, ws_port: e.target.value})} placeholder="5000" className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm font-bold text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none disabled:cursor-not-allowed" />
              </div>
            </div>

            {/* BUTTON SUBMIT */}
            <div className="pt-4 flex items-center gap-4">
              <button type="submit" disabled={isSaving || !selectedAcc} className="flex-1 bg-[var(--primary)] hover:opacity-90 text-white font-black py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                {isSaving ? "Menyimpan..." : <><Save size={18}/> Simpan Konfigurasi</>}
              </button>
              
              {/* Notifikasi Sukses */}
              <div className={`transition-all duration-300 ${saveStatus === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none w-0 overflow-hidden'}`}>
                <div className="bg-green-500/20 text-green-500 border border-green-500/30 px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-sm whitespace-nowrap">
                  <CheckCircle2 size={18}/> Tersimpan!
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}