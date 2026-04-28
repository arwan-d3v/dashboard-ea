//+------------------------------------------------------------------+
//|                                             KRX-Gold-Final.mq5   |
//|                                        Copyright 2026, Arwan RM™ |
//|                                   https://t.me/+r1cWZ8_4DEJjMGI1 |
//+------------------------------------------------------------------+
#property copyright "Arwan RM™"
#property link      "https://t.me/+r1cWZ8_4DEJjMGI1"
#property version   "1.27" // Diperbarui untuk License Guard
#property description "SLOWLY but SURELY - With 4-Layer Firebase Security"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

//--- Enums
enum ENUM_TRADE_DIR {
   DIR_BUY,       // Buy Only
   DIR_SELL,      // Sell Only
   DIR_AUTO       // Auto (Follow Prev Candle Close)
};

//====================================================================
// INPUT PARAMETERS
//====================================================================
input group "=== License & Security ==="
input string         InpLicenseKey        = "KRX-XXXX-XXXX-XXXX"; // License Key (Wajib KRX-)
input string         InpFirebaseURL       = "https://YOUR-DB-ID.firebaseio.com"; // Firebase URL (Tanpa '/' di akhir)

input group "=== Volume & Grid Settings ==="
input double         InitialLot           = 0.01;
input double         LotMultiplier        = 1.1;
input double         GridPips             = 30.0;
input int            MaxGridLayers        = 99;

input group "=== Take Profit Settings (Pips) ==="
input double         BasketProfitPips     = 44.75;
input double         TrendFollowTP_Pips   = 35.0;
input double         ScalpingTP_Pips      = 30.0;

input group "=== Daily Target & Time Filter ==="
input double         MaxDailyProfitUSD    = 100000.0;
input bool           UseTimeFilter        = true;
input int            StartHour_GMT8       = 7;
input int            StartMinute          = 5;
input int            StopHour_GMT8        = 23;
input int            StopMinute           = 45;

input group "=== General Settings ==="
input ENUM_TRADE_DIR TradeDirection       = DIR_AUTO;
input ulong          MagicNumber          = 20260321;
input ulong          Slippage             = 10;

//====================================================================
// GLOBAL VARIABLES
//====================================================================
CTrade         trade;
CPositionInfo  pos;

// Trading Variables
double         g_CenterPrice     = 0.0;
int            g_CurrentLayer    = 0;
bool           g_DailyTargetHit  = false;
int            g_LastDayHit      = -1;
string         g_PrimaryDir      = "";
const double   PIP_VALUE         = 0.100;

// Security Variables
int            g_ConnectionFails = 0;
const int      MAX_CONNECTION_FAILS = 3;

//====================================================================
// INIT & DEINIT
//====================================================================
int OnInit()
{
   // --- LICENSE GUARD (Layer 1 & 2 Init) ---
   if(!MQLInfoInteger(MQL_TESTER)) {
      if(StringLen(InpLicenseKey) != 19 || StringSubstr(InpLicenseKey, 0, 4) != "KRX-") {
         Print("SECURITY ERROR: Format License Key tidak valid. Wajib menggunakan KRX-XXXX-XXXX-XXXX");
         return(INIT_FAILED);
      }
      
      Print("Membuka enkripsi lisensi ke Firebase...");
      if(!CheckLicense(true)) {
         Print("SECURITY ERROR: Lisensi ditolak oleh server.");
         return(INIT_FAILED);
      }
      Print("Lisensi Valid! Mengaktifkan pengamanan Real-time (5 Menit).");
   }

   // --- System Init ---
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(Slippage);
   trade.SetTypeFillingBySymbol(_Symbol);

   CreateDashboard();
   Print("EA Initialized. Stay Calm and ACTIVE.");
   
   // Setup Timer for Continuous Checking & Heartbeat (Layer 4)
   EventSetTimer(300); // Trigger setiap 300 detik (5 Menit)

   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   ObjectsDeleteAll(0, "DASH_");
}

//====================================================================
// CONTINUOUS VERIFICATION (ON TIMER)
//====================================================================
void OnTimer()
{
   // Jika Backtest, jangan jalankan WebRequest agar tidak macet
   if(MQLInfoInteger(MQL_TESTER)) return;

   // Layer 4: Verifikasi Berkelanjutan
   if(!CheckLicense(false)) {
      Print("SECURITY BREACH: Lisensi tidak valid di tengah jalan. Menutup EA...");
      CloseAllPositions(); // Eksekusi force-close dari prompt
      ExpertRemove();      // Cabut EA dari chart
   } else {
      // Jika aman, kirim detak jantung (Heartbeat) ke server
      UpdateHeartbeat();
   }
}


//====================================================================
// CORE TICK LOGIC (Tidak ada WebRequest di sini)
//====================================================================
void OnTick()
{
   MqlDateTime dtLocal;
   TimeToStruct(TimeLocal(), dtLocal);

   if(dtLocal.day != g_LastDayHit) {
      g_DailyTargetHit = false;
   }

   int buyCount=0, sellCount=0;
   double buyLots=0, sellLots=0, totalFloating=0;

   for(int i=PositionsTotal()-1; i>=0; i--) {
      if(pos.SelectByIndex(i)) {
         if(pos.Magic() == MagicNumber && pos.Symbol() == _Symbol) {
            totalFloating += pos.Profit() + pos.Swap() + pos.Commission();
            if(pos.PositionType() == POSITION_TYPE_BUY) {
               buyCount++; buyLots += pos.Volume();
            } else if(pos.PositionType() == POSITION_TYPE_SELL) {
               sellCount++; sellLots += pos.Volume();
            }
         }
      }
   }
   
   int totalPos = buyCount + sellCount;

   if(totalPos == 0) {
      g_CenterPrice = 0.0;
      g_CurrentLayer = 0;
      g_PrimaryDir = "";
   } else if (g_CenterPrice == 0.0) {
      RecoverState();
   }

   double dailyClosedProfit = GetClosedProfitTodayLocal();
   if(!g_DailyTargetHit && dailyClosedProfit >= MaxDailyProfitUSD) {
      g_DailyTargetHit = true;
      g_LastDayHit = dtLocal.day;
      Print("Daily Target Hit! Pausing until tomorrow.");
   }

   bool isTradingTime = CheckTimeFilter(dtLocal);
   string status = "ACTIVE";
   
   if(g_DailyTargetHit) {
      if(totalPos > 0) status = "ACTIVE"; else status = "PAUSED (Daily Target Hit)";
   }
   else if(UseTimeFilter && !isTradingTime) {
      if(totalPos > 0) status = "ACTIVE"; else status = "PAUSED (Outside Trading Hours)";
   }

   UpdateDashboard(status, buyCount, buyLots, sellCount, sellLots, totalFloating, dailyClosedProfit);

   if(totalPos > 0) {
      CheckHiddenTPs(totalFloating, totalLots(buyLots, sellLots));
      totalPos = 0;
      for(int i=PositionsTotal()-1; i>=0; i--) {
         if(PositionGetSymbol(i) == _Symbol && PositionGetInteger(POSITION_MAGIC) == MagicNumber) totalPos++;
      }
      if(totalPos == 0) return;
   }

   if(status == "ACTIVE") {
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      
      if(totalPos == 0) OpenInitialPosition(ask, bid);
      else if(g_CurrentLayer < MaxGridLayers) CheckAndOpenGrid(ask, bid);
   }
}

//====================================================================
// SECURITY & FIREBASE FUNCTIONS (THE LICENSE GUARD)
//====================================================================

// Fungsi Utama Pengecekan
bool CheckLicense(bool isInitialCheck = false)
{
   if(MQLInfoInteger(MQL_TESTER)) return true;

   long account = AccountInfoInteger(ACCOUNT_LOGIN);
   string server = AccountInfoString(ACCOUNT_SERVER);
   string url = InpFirebaseURL + "/licenses/" + IntegerToString(account) + ".json";

   char post[], result[];
   string headers;
   string result_headers;

   // Strict WebRequest (7 parameters)
   int res = WebRequest("GET", url, headers, 5000, post, result, result_headers);

   // FAIL-SAFE MECHANISM
   if(res != 200) {
      g_ConnectionFails++;
      Print("Firebase connection failed. Error: ", GetLastError(), " | HTTP: ", res);
      if(g_ConnectionFails >= MAX_CONNECTION_FAILS) {
         Print("Maksimal toleransi putus koneksi tercapai.");
         if(!isInitialCheck) SendFirebaseAlert("Koneksi EA ke server lisensi terputus berulang kali.");
         return false; // Paksa berhenti
      }
      return true; // Beri toleransi jika masih < 3 kali gagal
   }

   g_ConnectionFails = 0; // Reset counter jika sukses
   string json = CharArrayToString(result);

   // Layer 1: Data Integrity
   if(json == "null" || json == "") {
      Print("License data not found for account: ", account);
      if(!isInitialCheck) SendFirebaseAlert("Lisensi tidak ditemukan (kemungkinan dihapus dari database).");
      return false;
   }

   string db_key    = GetJsonValue(json, "license_key");
   string db_server = GetJsonValue(json, "broker_server");
   string db_status = GetJsonValue(json, "status");
   string db_expiry = GetJsonValue(json, "expiry_date");

   // Layer 2: Account & Broker Locking
   if(db_key != InpLicenseKey) {
      if(!isInitialCheck) SendFirebaseAlert("Ketidakcocokan License Key terdeteksi.");
      return false;
   }
   if(ToLower(db_server) != ToLower(server)) {
      if(!isInitialCheck) SendFirebaseAlert("Broker server mismatch. Percobaan pemindahan EA ilegal ke: " + server);
      return false;
   }

   // Layer 3: State & Expiry Validation
   if(db_status != "ACTIVE") {
      if(!isInitialCheck) SendFirebaseAlert("Lisensi dicabut paksa oleh sistem. (Status: " + db_status + ")");
      return false;
   }

   long expiry_ms = StringToInteger(db_expiry);
   long current_ms = TimeCurrent() * 1000;
   if(expiry_ms > 0 && current_ms > expiry_ms) {
      if(!isInitialCheck) SendFirebaseAlert("Masa berlaku lisensi telah habis.");
      return false;
   }

   return true;
}

// Update Waktu Jantung (Heartbeat)
void UpdateHeartbeat()
{
   if(MQLInfoInteger(MQL_TESTER)) return;

   long account = AccountInfoInteger(ACCOUNT_LOGIN);
   string url = InpFirebaseURL + "/licenses/" + IntegerToString(account) + "/last_heartbeat.json";
   
   string json = IntegerToString(TimeCurrent() * 1000); // Unix timestamp MS
   
   char post[], result[];
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   string headers = "Content-Type: application/json\r\n";
   string result_headers;

   WebRequest("PUT", url, headers, 3000, post, result, result_headers);
}

// Kirim Peringatan ke Dashboard (Alerts)
void SendFirebaseAlert(string message)
{
   if(MQLInfoInteger(MQL_TESTER)) return;

   long account = AccountInfoInteger(ACCOUNT_LOGIN);
   string url = InpFirebaseURL + "/alerts/" + IntegerToString(account) + ".json";

   string json = "{\"message\":\"" + message + "\",\"timestamp\":" + IntegerToString(TimeCurrent()*1000) + ",\"type\":\"error\"}";

   char post[], result[];
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   string headers = "Content-Type: application/json\r\n";
   string result_headers;

   WebRequest("POST", url, headers, 3000, post, result, result_headers);
}

// Custom Lightweight JSON Parser (Bypass spasi & quote)
string GetJsonValue(string json, string key)
{
   string search = "\"" + key + "\":";
   int start = StringFind(json, search);
   if(start < 0) return "";
   start += StringLen(search);

   while(start < StringLen(json) && (StringSubstr(json, start, 1) == " " || StringSubstr(json, start, 1) == "\t")) start++;

   int end = -1;
   if(StringSubstr(json, start, 1) == "\"") {
      start++;
      end = StringFind(json, "\"", start);
   } else {
      int endComma = StringFind(json, ",", start);
      int endBrace = StringFind(json, "}", start);
      if(endComma > 0 && endBrace > 0) end = MathMin(endComma, endBrace);
      else if(endComma > 0) end = endComma;
      else end = endBrace;
   }

   if(end > start) {
      string val = StringSubstr(json, start, end - start);
      StringTrimLeft(val); StringTrimRight(val);
      return val;
   }
   return "";
}

// Helper untuk Case-Insensitive Server Checking
string ToLower(string str) {
   string res = str;
   StringToLower(res);
   return res;
}

//====================================================================
// TRADING LOGIC & UTILITIES (TIDAK BERUBAH)
//====================================================================
void OpenInitialPosition(double ask, double bid) {
   int dir = TradeDirection;
   if(dir == DIR_AUTO) {
      double close1 = iClose(_Symbol, PERIOD_CURRENT, 1);
      double open1 = iOpen(_Symbol, PERIOD_CURRENT, 1);
      dir = (close1 > open1) ? DIR_BUY : DIR_SELL;
   }

   if(dir == DIR_BUY) {
      if(trade.Buy(InitialLot, _Symbol, ask, 0, 0, "INI_B")) {
         g_CenterPrice = NormalizeDouble(ask, _Digits);
         g_PrimaryDir = "BUY"; g_CurrentLayer = 0;
      }
   } else if(dir == DIR_SELL) {
      if(trade.Sell(InitialLot, _Symbol, bid, 0, 0, "INI_S")) {
         g_CenterPrice = NormalizeDouble(bid, _Digits);
         g_PrimaryDir = "SELL"; g_CurrentLayer = 0;
      }
   }
}

void CheckAndOpenGrid(double ask, double bid) {
   double gridDistancePrice = GridPips * PIP_VALUE;
   double nextGridPrice = 0.0;
   bool triggerGrid = false;

   if(g_PrimaryDir == "BUY") {
      nextGridPrice = NormalizeDouble(g_CenterPrice - ((g_CurrentLayer + 1) * gridDistancePrice), _Digits);
      if(bid <= nextGridPrice) triggerGrid = true;
   } else if(g_PrimaryDir == "SELL") {
      nextGridPrice = NormalizeDouble(g_CenterPrice + ((g_CurrentLayer + 1) * gridDistancePrice), _Digits);
      if(ask >= nextGridPrice) triggerGrid = true;
   }

   if(triggerGrid) {
      double lotSize = NormalizeDouble(InitialLot * MathPow(LotMultiplier, g_CurrentLayer + 1), 2);
      if(g_PrimaryDir == "BUY") {
         trade.Buy(lotSize, _Symbol, ask, 0, 0, "AVG_B"); trade.Sell(lotSize, _Symbol, bid, 0, 0, "SCL_S");
      } else {
         trade.Sell(lotSize, _Symbol, bid, 0, 0, "AVG_S"); trade.Buy(lotSize, _Symbol, ask, 0, 0, "SCL_B");
      }
      g_CurrentLayer++;
   }
}

void CheckHiddenTPs(double totalFloating, double totalLots) {
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double contractSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_CONTRACT_SIZE);

   if(g_CurrentLayer == 0) {
      double trendFollowDiff = TrendFollowTP_Pips * PIP_VALUE;
      if(g_PrimaryDir == "BUY" && bid >= g_CenterPrice + trendFollowDiff) { CloseAllPositions(); return; }
      if(g_PrimaryDir == "SELL" && ask <= g_CenterPrice - trendFollowDiff) { CloseAllPositions(); return; }
   } else {
      double basketTargetUSD = (BasketProfitPips * PIP_VALUE) * totalLots * contractSize;
      if(totalFloating >= basketTargetUSD && totalLots > 0) { CloseAllPositions(); return; }
   }

   double scalpingTPDiff = ScalpingTP_Pips * PIP_VALUE;
   for(int i=PositionsTotal()-1; i>=0; i--) {
      if(pos.SelectByIndex(i) && pos.Magic() == MagicNumber && pos.Symbol() == _Symbol) {
         string comment = pos.Comment(); double openPrice = pos.PriceOpen(); ulong ticket = pos.Ticket();
         if(comment == "SCL_B" && bid >= openPrice + scalpingTPDiff) trade.PositionClose(ticket);
         else if(comment == "SCL_S" && ask <= openPrice - scalpingTPDiff) trade.PositionClose(ticket);
      }
   }
}

void CloseAllPositions() {
   for(int i=PositionsTotal()-1; i>=0; i--) {
      if(pos.SelectByIndex(i) && pos.Magic() == MagicNumber && pos.Symbol() == _Symbol) trade.PositionClose(pos.Ticket());
   }
   g_CenterPrice = 0.0; g_CurrentLayer = 0; g_PrimaryDir = "";
}

void RecoverState() {
   for(int i=PositionsTotal()-1; i>=0; i--) {
      if(pos.SelectByIndex(i) && pos.Magic() == MagicNumber && pos.Symbol() == _Symbol) {
         string c = pos.Comment();
         if(c == "INI_B") { g_CenterPrice = pos.PriceOpen(); g_PrimaryDir = "BUY"; }
         if(c == "INI_S") { g_CenterPrice = pos.PriceOpen(); g_PrimaryDir = "SELL"; }
      }
   }
   int maxAvg = 0;
   for(int i=PositionsTotal()-1; i>=0; i--) {
      if(pos.SelectByIndex(i) && pos.Magic() == MagicNumber && pos.Symbol() == _Symbol) {
         string c = pos.Comment();
         if(c == "AVG_B" || c == "AVG_S" || c == "SCL_B" || c == "SCL_S") maxAvg++;
      }
   }
   if(maxAvg > 0 && g_CurrentLayer == 0) g_CurrentLayer = maxAvg / 2;
}

bool CheckTimeFilter(MqlDateTime &dtLocal) {
   if(!UseTimeFilter) return true;
   int currentMins = dtLocal.hour * 60 + dtLocal.min;
   int startMins = StartHour_GMT8 * 60 + StartMinute;
   int stopMins = StopHour_GMT8 * 60 + StopMinute;
   if (startMins < stopMins) return (currentMins >= startMins && currentMins < stopMins);
   else return (currentMins >= startMins || currentMins < stopMins);
}

double GetClosedProfitTodayLocal() {
   int timeDiff = (int)(TimeLocal() - TimeCurrent());
   MqlDateTime dt; TimeToStruct(TimeLocal(), dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   datetime localMidnight = StructToTime(dt);
   datetime serverMidnight = localMidnight - timeDiff;

   HistorySelect(serverMidnight, TimeCurrent() + 86400);
   double profit = 0;
   for(int i=0; i<HistoryDealsTotal(); i++) {
      ulong ticket = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(ticket, DEAL_MAGIC) == MagicNumber && HistoryDealGetString(ticket, DEAL_SYMBOL) == _Symbol) {
         profit += HistoryDealGetDouble(ticket, DEAL_PROFIT) + HistoryDealGetDouble(ticket, DEAL_SWAP) + HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      }
   }
   return profit;
}

double totalLots(double b, double s) { return b + s; }

//====================================================================
// DASHBOARD UI (TIDAK BERUBAH)
//====================================================================
void CreateLabel(string name, int x, int y, int fontSize = 10, color clr = clrWhite) {
   ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetString(0, name, OBJPROP_FONT, "Trebuchet MS");
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, fontSize);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
}

void CreateDashboard() {
   CreateLabel("DASH_HEADER", 20, 20, 12, clrGold); CreateLabel("DASH_STATUS", 20, 45, 10, clrWhite);
   CreateLabel("DASH_CENTER", 20, 65, 10, clrLightGray); CreateLabel("DASH_LAYER",  20, 85, 10, clrLightGray);
   CreateLabel("DASH_BUY",    20, 105, 10, clrDodgerBlue); CreateLabel("DASH_SELL",   20, 125, 10, clrOrangeRed);
   CreateLabel("DASH_FLOAT",  20, 145, 10, clrWhite); CreateLabel("DASH_DAILY",  20, 165, 10, clrYellow);
   CreateLabel("DASH_NEXT",   20, 185, 10, clrLightGray); CreateLabel("DASH_TIME",   20, 205, 10, clrLightGray);
   CreateLabel("DASH_MAGIC",  20, 225, 9, clrGray);
}

void UpdateDashboard(string status, int bCount, double bLot, int sCount, double sLot, double floatUSD, double dailyUSD) {
   ObjectSetString(0, "DASH_HEADER", OBJPROP_TEXT, "KRX-Gold-Final");
   ObjectSetString(0, "DASH_STATUS", OBJPROP_TEXT, "EA Status       : " + status);
   ObjectSetString(0, "DASH_CENTER", OBJPROP_TEXT, "Center Price   : " + DoubleToString(g_CenterPrice, _Digits));
   ObjectSetString(0, "DASH_LAYER",  OBJPROP_TEXT, "Current Layer  : " + IntegerToString(g_CurrentLayer) + " / " + IntegerToString(MaxGridLayers));
   ObjectSetString(0, "DASH_BUY",    OBJPROP_TEXT, "Buy Pos         : " + IntegerToString(bCount) + " (" + DoubleToString(bLot,2) + " lot)");
   ObjectSetString(0, "DASH_SELL",   OBJPROP_TEXT, "Sell Pos         : " + IntegerToString(sCount) + " (" + DoubleToString(sLot,2) + " lot)");
   color floatClr = (floatUSD >= 0) ? clrLimeGreen : clrRed; ObjectSetInteger(0, "DASH_FLOAT", OBJPROP_COLOR, floatClr);
   ObjectSetString(0, "DASH_FLOAT",  OBJPROP_TEXT, "Total Floating  : " + ((floatUSD>=0)?"+$":"-$") + DoubleToString(MathAbs(floatUSD), 2));
   double dailyPct = (MaxDailyProfitUSD > 0) ? (dailyUSD / MaxDailyProfitUSD) * 100.0 : 0;
   ObjectSetString(0, "DASH_DAILY",  OBJPROP_TEXT, "Daily Profit     : $" + DoubleToString(dailyUSD, 2) + " / Max $" + DoubleToString(MaxDailyProfitUSD, 2) + " (" + DoubleToString(dailyPct, 1) + "%)");
   string nextGrid = "-";
   if(g_CenterPrice > 0 && g_CurrentLayer < MaxGridLayers) {
      double gridPrice = GridPips * PIP_VALUE;
      if(g_PrimaryDir == "BUY") nextGrid = DoubleToString(g_CenterPrice - ((g_CurrentLayer + 1) * gridPrice), _Digits) + " ?";
      else if(g_PrimaryDir == "SELL") nextGrid = DoubleToString(g_CenterPrice + ((g_CurrentLayer + 1) * gridPrice), _Digits) + " ?";
   }
   ObjectSetString(0, "DASH_NEXT",   OBJPROP_TEXT, "Next Grid Lvl   : " + nextGrid);
   string timeStr = UseTimeFilter ? StringFormat("%02d:%02d - %02d:%02d (WITA/GMT+8) -> ON", StartHour_GMT8, StartMinute, StopHour_GMT8, StopMinute) : "OFF";
   ObjectSetString(0, "DASH_TIME",   OBJPROP_TEXT, "Time Filter     : " + timeStr);
   ObjectSetString(0, "DASH_MAGIC",  OBJPROP_TEXT, "Magic: " + IntegerToString(MagicNumber) + " | v1.28");
}