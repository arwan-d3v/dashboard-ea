"use client";
import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  Wallet, ArrowDownToLine, ArrowUpFromLine, 
  CalendarDays, BarChart3, Clock, AlertTriangle, 
  Server, User, ChevronDown, Globe, Cpu
} from "lucide-react";
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { db } from "../lib/firebase";
import { ref, onValue } from "firebase/database";

// --- IMPORT MODULE ANIMASI & WEBSOCKET ---
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// --- DICTIONARY LOTTIE URL (EMBED DARI LUAR) ---
const animUrl = {
  SCANNING: "", // Dikosongkan karena kita sekarang menggunakan Pure CSS Super Smooth Radar
  AI_ANALYZING: "https://lottie.host/28f9c14c-1120-4318-80f2-b8832a81fcd9/4fWqC29l7L.json",   // Otak AI / Loading
  ENTRY_EXECUTION: "https://lottie.host/d4615a97-9e73-4ea2-80ea-7debc24a187f/VbWkUaM98y.json", // Laser / Eksekusi
  SHIELD_ACTIVE: "https://lottie.host/81b22295-d2fc-4b71-91a7-5ba7b2c0f6ec/0F5S5BfC0t.json",   // Perisai Biru (BE/Trailing)
  PROFIT_SECURED: "https://lottie.host/17e6e584-6997-40ea-9e32-23c21c7d2c34/Lh3C7bZfQo.json"  // Centang Profit
};

const dict = {
  en: {
    livePort: "Live Portfolio", floating: "Floating", connected: "Connected (MT5)",
    update: "Last Update", absGrowth: "Absolute Growth", basedOnInitial: "Based on Initial Deposit",
    pureProfit: "Pure Profit", pureTrading: "Pure Trading Result", curBalance: "Current Balance",
    marginLevel: "Margin Level", maxDrawdown: "Max Drawdown", basedOnHWM: "Based on High Water Mark",
    initDepo: "Initial Deposit", topUp: "Top Up (Add)", withdrawals: "Withdrawals", netCapital: "Net Capital",
    chartTitle: "Growth Trajectory", dailyPerf: "Daily Performance (5 Days)",
    livePositions: "Live Open Positions", noPositions: "No open positions right now. Waiting for EA signals...",
    ticket: "Ticket / Symbol", type: "Type", volume: "Volume", openPrice: "Open Price",
    curPrice: "Current Price", profit: "Profit (PnL)",
    daysShort: { sun: "SUN", mon: "MON", tue: "TUE", wed: "WED", thu: "THU", fri: "FRI", sat: "SAT" }
  },
  id: {
    livePort: "Portofolio Live", floating: "Mengambang", connected: "Terkoneksi (MT5)",
    update: "Pembaruan", absGrowth: "Pertumbuhan Absolut", basedOnInitial: "Berdasarkan Modal Awal",
    pureProfit: "Profit Murni", pureTrading: "Hasil Trading Murni", curBalance: "Saldo Saat Ini",
    marginLevel: "Level Margin", maxDrawdown: "Drawdown Maksimal", basedOnHWM: "Berdasarkan High Water Mark",
    initDepo: "Deposit Awal", topUp: "Top Up (Tambah)", withdrawals: "Penarikan Dana", netCapital: "Modal Bersih",
    chartTitle: "Pertumbuhan Saldo vs Ekuitas", dailyPerf: "Performa Harian (5 Hari)",
    livePositions: "Posisi Terbuka Langsung", noPositions: "Tidak ada posisi terbuka saat ini. Menunggu sinyal EA...",
    ticket: "Tiket / Simbol", type: "Tipe", volume: "Volume", openPrice: "Harga Buka",
    curPrice: "Harga Saat Ini", profit: "Profit (PnL)",
    daysShort: { sun: "MIN", mon: "SEN", tue: "SEL", wed: "RAB", thu: "KAM", fri: "JUM", sat: "SAB" }
  }
};

export default function Dashboard() {
  const [lang, setLang] = useState("en"); 
  const t = dict[lang]; 

  const [allAccountsData, setAllAccountsData] = useState({});
  const [accountsList, setAccountsList] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE UNTUK ROBOT AI ---
  const [robotState, setRobotState] = useState('SCANNING');
  const [tradeInfo, setTradeInfo] = useState('Scanning XAUUSD...');

  // --- EFFECT UNTUK KONEKSI WEBSOCKET (VPS) ---
  useEffect(() => {
    // PENTING: GANTI IP INI DENGAN IP PUBLIK VPS ANDA JIKA BERUBAH
    const socket = io('http://118.193.78.150:5000');

    socket.on('connect', () => {
      console.log('Terhubung dengan Otak AI di VPS!');
      setTradeInfo('Koneksi Neural Terhubung ke VPS.');
    });

    socket.on('robot_status_update', (data) => {
      if (data.status) setRobotState(data.status);
      if (data.info) setTradeInfo(data.info);
    });

    socket.on('disconnect', () => {
      setRobotState('SCANNING');
      setTradeInfo('Koneksi terputus dari VPS. Mencoba menyambung kembali...');
    });

    return () => socket.disconnect();
  }, []);

  // --- EFFECT UNTUK FIREBASE (DATA MT5) ---
  useEffect(() => {
    const accountsRef = ref(db, 'account_data');
    const unsubscribe = onValue(accountsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAllAccountsData(data);
        const accounts = Object.keys(data);
        setAccountsList(accounts);
        if (!selectedAccountId || !accounts.includes(selectedAccountId)) {
          setSelectedAccountId(accounts[0]);
        }
      } else {
        setAllAccountsData({});
        setAccountsList([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedAccountId]);

  const currentAccountData = allAccountsData[selectedAccountId] || {};
  const liveData = currentAccountData.realtime_stats || null;
  const openTrades = currentAccountData.open_trades || [];
  const metaData = currentAccountData.metadata || {};

  const isEATrading = openTrades.length > 0;
  const brokerName = metaData.broker || "Membaca Server..."; 
  const accountName = metaData.investor_name || "Investor";

  const formatCur = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val || 0);
  const formatPct = (val) => `${Number(val || 0).toFixed(2)}%`;
  const formatTimeGMT8 = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID', {
      timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }) + " GMT+8";
  };

  const initDepo = liveData?.initial_deposit || 10000;
  const curBal = liveData?.balance || 10000;
  const curEq = liveData?.equity || 10000;
  const mockChartData = [
    { date: 'Start', balance: initDepo, equity: initDepo },
    { date: 'Wk 1', balance: initDepo + (curBal-initDepo)*0.15, equity: initDepo + (curEq-initDepo)*0.10 },
    { date: 'Wk 2', balance: initDepo + (curBal-initDepo)*0.35, equity: initDepo + (curEq-initDepo)*0.45 },
    { date: 'Wk 3', balance: initDepo + (curBal-initDepo)*0.65, equity: initDepo + (curEq-initDepo)*0.55 },
    { date: 'Wk 4', balance: initDepo + (curBal-initDepo)*0.85, equity: initDepo + (curEq-initDepo)*0.95 },
    { date: 'Now', balance: curBal, equity: curEq },
  ];

  const snapshots = currentAccountData.snapshots || {};
  const realDailyHistory = Object.keys(snapshots)
    .sort((a, b) => b - a) 
    .slice(0, 5) 
    .map(ts => {
      let timeMs = parseInt(ts);
      if (timeMs < 10000000000) timeMs = timeMs * 1000; 
      
      const dateObj = new Date(timeMs);
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayName = t.daysShort[dayNames[dateObj.getDay()]];

      const dayData = snapshots[ts];
      return {
        id: ts,
        date: dayName,
        profit: dayData.daily_profit || 0,
        growth: dayData.daily_growth_percent || 0,
        lot: dayData.daily_lots || 0
      };
    });

  const renderRobotAnimation = () => {
    switch (robotState) {
      case 'AI_ANALYZING': return animUrl.AI_ANALYZING;
      case 'ENTRY_EXECUTION': return animUrl.ENTRY_EXECUTION;
      case 'SHIELD_ACTIVE': return animUrl.SHIELD_ACTIVE;
      case 'PROFIT_SECURED': return animUrl.PROFIT_SECURED;
      case 'SCANNING':
      default: return null; 
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen font-bold text-[var(--primary)] animate-pulse text-xl">Connecting to Server...</div>;
  
  if (accountsList.length === 0 || !liveData) return (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
      <AlertTriangle size={64} className="text-orange-500 opacity-50" />
      <h2 className="text-2xl font-bold text-[var(--foreground)]">{t.noPositions}</h2>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans transition-colors duration-300">
      
      {/* HEADER: LIVE PORTFOLIO & KONTROL */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm relative overflow-hidden">
        
        {/* Kiri: Nominal & Status */}
        <div className="z-10 w-full lg:w-auto">
          <h2 className="text-sm font-black text-[var(--muted-foreground)] uppercase tracking-widest flex items-center gap-2 mb-4">
             <Activity className="text-[var(--primary)]" size={16}/> {t.livePort}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
             <span className="text-4xl md:text-5xl font-black text-[var(--foreground)] tracking-tight">
                {formatCur(liveData.equity)}
             </span>
             {liveData.total_floating < 0 ? (
                <span className="text-sm font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg flex items-center border border-red-500/20 shadow-sm">
                  <TrendingDown size={16} className="mr-1.5"/> {t.floating} {formatCur(liveData.total_floating)}
                </span>
             ) : (
                <span className="text-sm font-bold bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg flex items-center border border-green-500/20 shadow-sm">
                  <TrendingUp size={16} className="mr-1.5"/> {t.floating} +{formatCur(liveData.total_floating)}
                </span>
             )}
          </div>
        </div>

        {/* Kanan: Dropdown Akun, Bahasa, Broker, dan Status */}
        <div className="z-10 w-full lg:w-auto flex flex-col items-start lg:items-end gap-4 bg-[var(--muted)]/50 p-4 rounded-2xl border border-[var(--card-border)]">
          
          <div className="flex flex-wrap items-center gap-3 w-full justify-between lg:justify-end">
            {/* EA Status */}
            <div className="flex items-center gap-1.5 bg-[var(--background)] px-3 py-1.5 rounded-lg border border-[var(--card-border)] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isEATrading ? 'bg-green-400' : 'bg-blue-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isEATrading ? 'bg-green-500' : 'bg-blue-500'}`}></span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isEATrading ? 'text-green-500' : 'text-blue-500'}`}>
                {isEATrading ? 'In Market' : 'Standby'}
              </span>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-[var(--background)] p-1 rounded-lg border border-[var(--card-border)] shadow-sm">
              <button onClick={() => setLang('en')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${lang === 'en' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>EN</button>
              <button onClick={() => setLang('id')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${lang === 'id' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>ID</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1"><Server size={10}/> {brokerName}</span>
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1 mt-0.5"><User size={12} className="text-[var(--primary)]"/> {accountName}</span>
             </div>

             <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
               <select 
                 value={selectedAccountId} 
                 onChange={(e) => setSelectedAccountId(e.target.value)}
                 className="appearance-none w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-xs font-bold rounded-xl pl-3 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer shadow-sm"
               >
                 {accountsList.map(acc => (
                   <option key={acc} value={acc}>Acc: {acc}</option>
                 ))}
               </select>
               <ChevronDown size={14} className="absolute right-3 top-3 text-[var(--muted-foreground)] pointer-events-none" />
             </div>
          </div>

          <p className="text-[10px] text-[var(--muted-foreground)] font-medium flex items-center gap-1 mt-1">
             <Clock size={10} className="text-[var(--primary)]"/> {t.update}: {formatTimeGMT8(liveData.last_update)}
          </p>
        </div>
      </div>

      {/* --- ZONA AI COMMAND CENTER PURE CSS --- */}
      <div className="bg-[var(--card-bg)] border border-[var(--primary)]/30 rounded-3xl p-4 md:p-6 shadow-[0_0_15px_rgba(59,130,246,0.1)] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden transition-all duration-300">
        
        {/* Kontainer Animasi Hibrida (CSS + Lottie) */}
        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-900 rounded-full border-4 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center p-2 overflow-hidden relative">
          
          {robotState === 'SCANNING' ? (
            /* --- RADAR PURE CSS (100% Smooth 60FPS) --- */
            <>
              {/* Sapuan Radar Berputar (The Sweeper) */}
              <div className="absolute inset-0 w-full h-full animate-[spin_2s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_70%,rgba(59,130,246,0.8)_100%)]"></div>
              
              {/* Lingkaran Konsentris (Jaring Target) */}
              <div className="absolute inset-2 md:inset-3 rounded-full border border-blue-400/30"></div>
              <div className="absolute inset-6 md:inset-8 rounded-full border border-blue-400/10"></div>
              
              {/* Garis Crosshair (Vertikal & Horizontal) */}
              <div className="absolute w-full h-[1px] bg-blue-400/20"></div>
              <div className="absolute h-full w-[1px] bg-blue-400/20"></div>
              
              {/* Core AI Icon */}
              <div className="relative z-10 bg-gray-900 p-2 rounded-full border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                <Cpu size={24} className="text-blue-400 animate-pulse" />
              </div>
            </>
          ) : renderRobotAnimation() ? (
            /* --- LOTTIE FALLBACK UNTUK LASER / SHIELD --- */
            <Lottie 
              key={robotState} 
              path={renderRobotAnimation()} 
              loop={true}
              autoplay={true} 
              style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }} 
            />
          ) : (
            <Cpu size={40} className="text-blue-500 animate-pulse" />
          )}

        </div>
        
        {/* Status Text AI */}
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
            <Cpu className="text-[var(--primary)]" size={20}/> Agentic AI Core
          </h3>
          <p className="text-2xl font-mono text-[var(--primary)] mt-1 font-bold">
            [{robotState.replace('_', ' ')}]
          </p>
          <p className={`text-sm font-bold mt-2 px-3 py-1 rounded-lg inline-block 
            ${robotState === 'PROFIT_SECURED' ? 'bg-green-500/20 text-green-400' : 
              robotState === 'SHIELD_ACTIVE' ? 'bg-blue-500/20 text-blue-400' : 
              robotState === 'ENTRY_EXECUTION' ? 'bg-orange-500/20 text-orange-400' : 
              'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}
          >
            {tradeInfo}
          </p>
        </div>
      </div>
      {/* ------------------------------------- */}

      {/* ZONA 1: THE PERFORMANCE BILLBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.absGrowth, val: `${liveData.absolute_growth_percent > 0 ? '+' : ''}${formatPct(liveData.absolute_growth_percent)}`, sub: t.basedOnInitial, icon: TrendingUp, color: 'text-green-500' },
          { label: t.pureProfit, val: formatCur(liveData.pure_profit), sub: t.pureTrading, icon: DollarSign, color: 'text-[var(--primary)]' },
          { label: t.curBalance, val: formatCur(liveData.balance), sub: `${t.marginLevel}: ${formatPct(liveData.margin_level)}`, icon: Wallet, color: 'text-[var(--foreground)]' },
          { label: t.maxDrawdown, val: `-${formatPct(liveData.drawdown_percent)}`, sub: t.basedOnHWM, icon: TrendingDown, color: 'text-red-500' }
        ].map((item, i) => (
          <div key={i} className={`bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 flex flex-col justify-between shadow-sm transition-colors hover:border-[var(--primary)] ${i===3 ? 'border-b-4 border-b-red-500' : ''}`}>
            <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest flex items-center gap-2">
              <item.icon size={14} className={item.color}/> {item.label}
            </p>
            <div className={`mt-4 text-2xl font-black tracking-tight ${i===0?'text-green-500':i===3?'text-red-500':'text-[var(--foreground)]'}`}>
              {item.val}
            </div>
            {i === 2 && (
              <div className="w-full bg-[var(--muted)] rounded-full h-1 mt-2 mb-1 overflow-hidden">
                <div className="bg-[var(--primary)] h-full rounded-full" style={{ width: `${Math.min(liveData.margin_level, 100)}%` }}></div>
              </div>
            )}
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1 font-medium">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* ZONA 2: CASH FLOW LEDGER */}
      <div className="bg-[var(--muted)]/50 rounded-2xl p-5 border border-[var(--card-border)] flex flex-wrap gap-4 justify-between items-center shadow-sm">
        {[
          { label: t.initDepo, val: formatCur(liveData.initial_deposit), icon: Wallet, c: 'text-blue-500' },
          { label: t.topUp, val: formatCur(liveData.additional_deposits), icon: ArrowDownToLine, c: 'text-green-500' },
          { label: t.withdrawals, val: formatCur(liveData.total_withdrawals), icon: ArrowUpFromLine, c: 'text-red-500' }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 w-full md:w-auto">
            <div className={`p-2.5 rounded-xl bg-[var(--background)] shadow-sm border border-[var(--card-border)] ${item.c}`}><item.icon size={16}/></div>
            <div>
              <p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{item.label}</p>
              <p className="font-bold text-[var(--foreground)] text-sm">{item.val}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-[var(--card-border)] pt-4 md:pt-0 mt-2 md:mt-0">
          <div>
            <p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest md:text-right">{t.netCapital}</p>
            <p className="font-black text-xl tracking-tight text-[var(--primary)]">{formatCur(liveData.initial_deposit + liveData.additional_deposits - liveData.total_withdrawals)}</p>
          </div>
        </div>
      </div>

      {/* ZONA 3: CHART & DAILY 5-DAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] p-6 shadow-sm">
          <h3 className="font-bold text-sm text-[var(--foreground)] mb-6 flex items-center gap-2"><Activity size={16} className="text-[var(--primary)]"/> {t.chartTitle}</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '12px' }} itemStyle={{ fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" name="Equity" activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}/>
                <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }} name="Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] p-6 flex flex-col shadow-sm">
          <h3 className="font-bold text-sm text-[var(--foreground)] mb-6 flex items-center gap-2"><CalendarDays size={16} className="text-[var(--primary)]"/> {t.dailyPerf}</h3>
          <div className="space-y-2 flex-grow flex flex-col justify-center">
            {realDailyHistory.length > 0 ? (
              realDailyHistory.map((day, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] hover:bg-[var(--muted)] transition-colors shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)] uppercase">{day.date}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5"><BarChart3 size={10}/> {Number(day.lot).toFixed(1)} Vol</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${day.profit >= 0 ? "text-green-500" : "text-red-500"}`}>{day.profit > 0 ? "+" : ""}{formatCur(day.profit)}</p>
                    <p className={`text-[9px] font-bold ${day.growth >= 0 ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10"} inline-block px-1.5 py-0.5 rounded mt-0.5`}>{day.growth > 0 ? "+" : ""}{Number(day.growth).toFixed(1)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-[var(--card-border)] border-dashed rounded-xl">
                <p className="text-xs font-bold text-[var(--muted-foreground)]">Belum ada rekam jejak harian.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZONA 4: LIVE OPEN POSITIONS */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--muted)]/30">
          <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2"><Clock size={16} className="text-[var(--primary)]" />{t.livePositions} ({openTrades.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--background)] text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--card-border)]">
                <th className="p-4 font-bold">{t.ticket}</th>
                <th className="p-4 font-bold text-center">{t.type}</th>
                <th className="p-4 font-bold text-center">{t.volume}</th>
                <th className="p-4 font-bold text-right">{t.openPrice}</th>
                <th className="p-4 font-bold text-right">{t.curPrice}</th>
                <th className="p-4 font-bold text-right">{t.profit}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {openTrades.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-xs text-[var(--muted-foreground)]">{t.noPositions}</td></tr>
              ) : (
                openTrades.map((trade, idx) => (
                  <tr key={idx} className="border-b border-[var(--card-border)] hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="p-4"><div className="font-bold text-[var(--foreground)]">{trade.symbol}</div><div className="text-[10px] text-[var(--muted-foreground)] font-mono">#{trade.ticket}</div></td>
                    <td className="p-4 text-center"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${trade.type === "BUY" ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"}`}>{trade.type}</span></td>
                    <td className="p-4 text-center font-mono font-bold text-[var(--foreground)]">{Number(trade.volume).toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-[var(--muted-foreground)] text-xs">{Number(trade.open_price).toFixed(3)}</td>
                    <td className="p-4 text-right font-mono font-medium text-[var(--foreground)] text-xs">{Number(trade.current_price).toFixed(3)}</td>
                    <td className={`p-4 text-right font-black ${trade.profit >= 0 ? "text-green-500" : "text-red-500"}`}>{trade.profit > 0 ? "+" : ""}{formatCur(trade.profit)}</td>
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