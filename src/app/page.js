"use client";

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  Wallet, ArrowDownToLine, ArrowUpFromLine, 
  CalendarDays, BarChart3, Clock, AlertTriangle, 
  Server, User, ChevronDown, Cpu, Terminal
} from "lucide-react";
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { db } from "../lib/firebase";
import { ref, onValue } from "firebase/database";
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// ============================================================================
// SECTION 2: CONFIGURATION & DICTIONARIES
// ============================================================================
const animUrl = {
  SCANNING: "", 
  AI_ANALYZING: "https://lottie.host/28f9c14c-1120-4318-80f2-b8832a81fcd9/4fWqC29l7L.json",   
  ENTRY_EXECUTION: "https://lottie.host/d4615a97-9e73-4ea2-80ea-7debc24a187f/VbWkUaM98y.json", 
  SHIELD_ACTIVE: "https://lottie.host/81b22295-d2fc-4b71-91a7-5ba7b2c0f6ec/0F5S5BfC0t.json",   
  PROFIT_SECURED: "https://lottie.host/17e6e584-6997-40ea-9e32-23c21c7d2c34/Lh3C7bZfQo.json",  
  SYSTEM_ERROR: "https://lottie.host/a60e0eb8-7ec3-440a-9d22-1d5756c66cf1/vj9XhS45N4.json"  
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

// ============================================================================
// SECTION 3: MAIN DASHBOARD COMPONENT
// ============================================================================
export default function Dashboard() {
  
  // ==========================================
  // SECTION 4: STATE MANAGEMENT
  // ==========================================
  const [lang, setLang] = useState("en"); 
  const t = dict[lang]; 

  const [allAccountsData, setAllAccountsData] = useState({});
  const [accountsList, setAccountsList] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Status & Terminal VPS State
  const [robotState, setRobotState] = useState('SCANNING');
  const [tradeInfo, setTradeInfo] = useState('Scanning XAUUSD...');
  const [ping, setPing] = useState("--"); // STATE UNTUK PING REALTIME
  
  const [terminalLogs, setTerminalLogs] = useState([
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: "SYSTEM BOOT: Initializing Agentic AI Shell...", type: "SYSTEM" }
  ]);
  const terminalEndRef = useRef(null);

  // ==========================================
  // SECTION 5: API & WEBSOCKET HOOKS
  // ==========================================
  useEffect(() => {
    const socket = io('http://118.193.78.150:5000'); 
    let pingInterval;

    const addLog = (text, type) => {
      setTerminalLogs(prev => {
        const newLogs = [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), text, type }];
        return newLogs.slice(-30); 
      });
    };

    socket.on('connect', () => {
      setRobotState('SCANNING');
      setTradeInfo('Koneksi Neural Terhubung ke VPS.');
      addLog("Koneksi WebSocket berhasil terjalin. Menunggu sinyal market...", "SCANNING");
      
      // Kirim Ping ke VPS setiap 2 detik
      pingInterval = setInterval(() => {
        socket.emit('ping_vps', Date.now());
      }, 2000);
    });

    // Menerima pantulan Pong dan menghitung selisih waktu
    socket.on('pong_vps', (clientTime) => {
      const latency = Date.now() - clientTime;
      setPing(latency);
    });

    socket.on('robot_status_update', (data) => {
      if (data.status) setRobotState(data.status);
      if (data.info) {
        setTradeInfo(data.info);
        addLog(data.info, data.status);
      }
    });

    socket.on('disconnect', () => {
      clearInterval(pingInterval);
      setPing("--"); // Set ping error
      setRobotState('SYSTEM_ERROR');
      setTradeInfo('Koneksi terputus dari VPS. Mencoba menyambung kembali...');
      addLog("KONEKSI TERPUTUS! Server VPS (Port 5000) tidak merespons.", "SYSTEM_ERROR");
    });

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

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


  // ==========================================
  // SECTION 6: DATA FORMATTING & CALCULATIONS
  // ==========================================
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
      case 'SYSTEM_ERROR': return animUrl.SYSTEM_ERROR; 
      case 'SCANNING':
      default: return null; 
    }
  };

  const getTerminalColor = (type) => {
    switch(type) {
      case 'AI_ANALYZING': return 'text-purple-400';
      case 'ENTRY_EXECUTION': return 'text-orange-400 font-bold';
      case 'SHIELD_ACTIVE': return 'text-cyan-400';
      case 'PROFIT_SECURED': return 'text-green-400 font-bold shadow-green-500/50 drop-shadow-md';
      case 'SYSTEM_ERROR': return 'text-red-500 font-black uppercase'; 
      default: return 'text-blue-300'; 
    }
  }

  // --- LOGIKA WARNA PING DINAMIS ---
  const getPingColor = (p) => {
    if (p === "--") return "text-red-500";
    if (p < 150) return "text-green-500 dark:text-green-400";
    if (p < 300) return "text-yellow-500 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  }

  if (isLoading) return <div className="flex justify-center items-center h-screen font-bold text-[var(--primary)] animate-pulse text-xl">Connecting to Server...</div>;
  
  if (accountsList.length === 0 || !liveData) return (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
      <AlertTriangle size={64} className="text-orange-500 opacity-50" />
      <h2 className="text-2xl font-bold text-[var(--foreground)]">{t.noPositions}</h2>
    </div>
  );


  // ==========================================
  // SECTION 7: UI RENDERING (THE VIEW)
  // ==========================================
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans transition-colors duration-300">
      
      {/* 7.1 HEADER PORTFOLIO & KONTROL AKUN */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm relative overflow-hidden">
        
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

        <div className="z-10 w-full lg:w-auto flex flex-col items-start lg:items-end gap-4 bg-[var(--muted)]/50 p-4 rounded-2xl border border-[var(--card-border)]">
          <div className="flex flex-wrap items-center gap-3 w-full justify-between lg:justify-end">
            <div className="flex items-center gap-1.5 bg-[var(--background)] px-3 py-1.5 rounded-lg border border-[var(--card-border)] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isEATrading ? 'bg-green-400' : 'bg-blue-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isEATrading ? 'bg-green-500' : 'bg-blue-500'}`}></span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isEATrading ? 'text-green-500' : 'text-blue-500'}`}>
                {isEATrading ? 'In Market' : 'Standby'}
              </span>
            </div>

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

      
      {/* 7.2 AI COMMAND CENTER (ADAPTIVE LIGHT/DARK MODE) */}
      <div className={`border rounded-3xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden transition-all duration-500
        ${robotState === 'SYSTEM_ERROR' 
          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/50 shadow-md' 
          : 'bg-[var(--card-bg)] border-[var(--card-border)] dark:border-[var(--primary)]/30 shadow-lg dark:shadow-[0_0_20px_rgba(59,130,246,0.15)]'}`}
      >
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[var(--primary)]/30 dark:border-[var(--primary)]/40 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[var(--primary)]/30 dark:border-[var(--primary)]/40 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[var(--primary)]/30 dark:border-[var(--primary)]/40 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[var(--primary)]/30 dark:border-[var(--primary)]/40 rounded-br-lg pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center text-center space-y-5 relative z-10">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full border-[1.5px] border-dashed border-blue-400/40 dark:border-blue-500/30 animate-[spin_15s_linear_infinite] pointer-events-none hidden md:block"></div>
            
            <div className={`w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-slate-50 dark:bg-gray-900 rounded-full border-4 flex items-center justify-center p-2 overflow-hidden relative z-10 transition-colors
              ${robotState === 'SYSTEM_ERROR' 
                ? 'border-red-400 dark:border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] dark:shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                : 'border-blue-300 dark:border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)] dark:shadow-[0_0_30px_rgba(59,130,246,0.5)]'}`}
            >
              {robotState === 'SCANNING' ? (
                <>
                  <div className="absolute inset-0 w-full h-full animate-[spin_2s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_70%,rgba(59,130,246,0.5)_100%)] dark:bg-[conic-gradient(from_0deg,transparent_70%,rgba(59,130,246,0.8)_100%)]"></div>
                  <div className="absolute inset-2 md:inset-3 rounded-full border border-blue-300/50 dark:border-blue-400/30"></div>
                  <div className="absolute inset-6 md:inset-8 rounded-full border border-blue-300/30 dark:border-blue-400/10"></div>
                  <div className="absolute w-full h-[1px] bg-blue-300/50 dark:bg-blue-400/20"></div>
                  <div className="absolute h-full w-[1px] bg-blue-300/50 dark:bg-blue-400/20"></div>
                  <div className="relative z-10 bg-white dark:bg-gray-900 p-2 rounded-full border border-blue-200 dark:border-blue-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                    <Cpu size={24} className="text-blue-500 dark:text-blue-400 animate-pulse" />
                  </div>
                </>
              ) : renderRobotAnimation() ? (
                <Lottie key={robotState} path={renderRobotAnimation()} loop={true} autoplay={true} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }} />
              ) : (
                <Cpu size={40} className={robotState === 'SYSTEM_ERROR' ? "text-red-500 animate-pulse" : "text-blue-500 animate-pulse"} />
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <h3 className={`text-lg font-black uppercase tracking-widest flex items-center justify-center gap-2
              ${robotState === 'SYSTEM_ERROR' ? "text-red-600 dark:text-red-500" : "text-[var(--primary)]"}`}>
              <Cpu size={18}/> Agentic AI Core
            </h3>
            
            <p className={`text-xl font-mono mt-0.5 font-bold tracking-widest transition-colors duration-300
              ${robotState === 'SYSTEM_ERROR' ? 'text-red-600 dark:text-red-500 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                robotState === 'SCANNING' ? 'text-blue-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' :
                'text-green-600 dark:text-green-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]'}`}
            >
              [{robotState.replace('_', ' ')}]
            </p>

            {/* PING REALTIME */}
            <div className="flex gap-4 justify-center mt-3 text-[9px] font-mono font-bold text-[var(--muted-foreground)] uppercase tracking-widest bg-slate-50 dark:bg-[var(--background)] px-3 py-1.5 rounded-md border border-slate-200 dark:border-[var(--card-border)] shadow-sm dark:shadow-inner transition-colors">
               <span className="flex items-center gap-1">
                 <Activity size={10} className={getPingColor(ping)}/> 
                 {ping}{ping !== "--" ? "ms" : ""}
               </span>
               <span className="flex items-center gap-1"><Server size={10} className="text-purple-500 dark:text-purple-400"/> v3.XGB</span>
               <span className="flex items-center gap-1"><Activity size={10} className="text-blue-500 dark:text-blue-400"/> M5</span>
            </div>
          </div>
        </div>

        {/* Panel Kanan: Live Terminal Shell */}
        <div className="md:col-span-2 bg-[#0f172a] dark:bg-[#050505] rounded-2xl border border-slate-700 dark:border-gray-800 p-4 font-mono text-[11px] sm:text-xs h-48 sm:h-56 overflow-y-auto flex flex-col gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-inner relative custom-scrollbar z-10 group transition-colors">
          
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity z-0" 
               style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px)', backgroundSize: '100% 3px' }}>
          </div>

          <div className="sticky top-0 bg-[#0f172a]/95 dark:bg-[#050505]/90 pb-2 border-b border-slate-700 dark:border-gray-800 mb-2 flex justify-between items-center z-10 backdrop-blur-md transition-colors">
             <span className="text-slate-400 dark:text-gray-500 font-bold flex items-center gap-2 tracking-widest text-[10px] md:text-xs">
               <Terminal size={14} className="text-slate-500 dark:text-gray-400"/> 
               BLACK_CATCHER_V3.exe
               <span className={`hidden sm:inline-block ml-2 px-1.5 py-0.5 border rounded text-[8px] animate-pulse
                 ${ping === "--" ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
                 {ping === "--" ? 'LINK OFFLINE' : 'SECURE LINK'}
               </span>
             </span>
             <span className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.6)]"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 shadow-[0_0_5px_rgba(234,179,8,0.6)]"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-[0_0_5px_rgba(34,197,94,0.6)]"></div>
             </span>
          </div>

          <div className="z-10 flex flex-col gap-2 flex-grow">
            {terminalLogs.map((log, i) => (
              <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-slate-500 dark:text-gray-600 shrink-0">[{log.time}]</span>
                <span className={`break-words ${getTerminalColor(log.type)}`}>
                  <span className="opacity-50 mr-1">{log.type === 'SCANNING' ? '>' : '>>'}</span> {log.text}
                </span>
              </div>
            ))}
            
            <div className="flex gap-3">
               <span className="text-slate-500 dark:text-gray-600 shrink-0">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
               <span className="text-slate-400 dark:text-gray-400 animate-[pulse_1s_ease-in-out_infinite]">_</span>
            </div>
            
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* 7.3 PERFORMANCE STATS BOXES */}
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


      {/* 7.4 CASH FLOW LEDGER */}
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


      {/* 7.5 CHART & 5-DAYS HISTORY */}
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


      {/* 7.6 LIVE OPEN POSITIONS */}
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