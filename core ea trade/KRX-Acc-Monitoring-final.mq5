//+------------------------------------------------------------------+
//|                                     KiroiX_Account_Monitor.mq5   |
//|                         Enterprise Edition - Realtime & Drawdown |
//|                                              Copyright KiroiX    |
//+------------------------------------------------------------------+
#property copyright "KiroiX Labs"
#property version   "2.00"
#property strict

#include <Trade\AccountInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- Input Parameters
input group "=== Firebase Settings ==="
input string    FirebaseDBURL      = "https://krx-modern-dev-default-rtdb.asia-southeast1.firebasedatabase.app";
input int       HeartbeatSeconds  = 3; // Kecepatan update data ke Dashboard (detik)

//--- Global Variables
string         g_AccountNumber;
double         g_HighWaterMark      = 0;

// Variabel Cash Flow
double         g_InitialDeposit     = 0;
double         g_AdditionalDeposits = 0;
double         g_TotalWithdrawals   = 0;
double         g_PureProfit         = 0;

CPositionInfo  pos;

//+------------------------------------------------------------------+
//| HTTP PUT Utility (Mengirim Data ke Firebase)                     |
//+------------------------------------------------------------------+
int HttpPut(string path, string json) {
   string cleanURL = FirebaseDBURL;
   // Pastikan URL diakhiri dengan garis miring (/)
   if(StringSubstr(cleanURL, StringLen(cleanURL)-1, 1) != "/") cleanURL += "/";
   string url = cleanURL + path + ".json";
   
   char post[], result[];
   string result_headers;
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post)-1); // Buang null terminator
   
   int res = WebRequest("PUT", url, "Content-Type: application/json\r\n", 5000, post, result, result_headers);
   if(res != 200) Print("Network Error [", res, "] for path: ", path);
   
   return res;
}

//+------------------------------------------------------------------+
//| Calculate Cash Flow (Initial, TopUp, WD, Profit)                 |
//+------------------------------------------------------------------+
void CalculateCashFlow() {
   HistorySelect(0, TimeCurrent());
   
   g_InitialDeposit     = 0;
   g_AdditionalDeposits = 0;
   g_TotalWithdrawals   = 0;
   g_PureProfit         = 0;
   
   bool isFirstDepositFound = false;
   
   for(int i=0; i<HistoryDealsTotal(); i++) {
      ulong ticket = HistoryDealGetTicket(i);
      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      
      // 1. Hitung Arus Kas (Deposit & Withdrawal)
      if(dealType == DEAL_TYPE_BALANCE) {
         if(profit > 0) {
            if(!isFirstDepositFound) {
               g_InitialDeposit = profit; // Deposit Pertama
               isFirstDepositFound = true;
            } else {
               g_AdditionalDeposits += profit; // Suntikan Dana (Top Up)
            }
         } else if(profit < 0) {
            g_TotalWithdrawals += MathAbs(profit); // Penarikan Dana (WD)
         }
      }
      
      // 2. Hitung Profit Murni (Hanya dari hasil Trading)
      if(dealType == DEAL_TYPE_BUY || dealType == DEAL_TYPE_SELL) {
         g_PureProfit += profit + 
                         HistoryDealGetDouble(ticket, DEAL_SWAP) + 
                         HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      }
   }
   
   // Failsafe jika akun tidak punya riwayat deposit awal (misal akun cent tua)
   if(g_InitialDeposit <= 0) g_InitialDeposit = AccountInfoDouble(ACCOUNT_BALANCE);
}

//+------------------------------------------------------------------+
//| Core: Send Realtime Snapshot & Open Trades                       |
//+------------------------------------------------------------------+
void SendRealtimeData() {
   // 1. Selalu update Cash Flow terbaru
   CalculateCashFlow();
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double marginLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   
   // 2. Calculate Absolute Drawdown (High Water Mark)
   if(equity > g_HighWaterMark) g_HighWaterMark = equity;
   double drawdownPercent = 0.0;
   if(g_HighWaterMark > 0 && equity < g_HighWaterMark) {
      drawdownPercent = ((g_HighWaterMark - equity) / g_HighWaterMark) * 100.0;
   }
   
   // 3. Calculate Growth Based ONLY on Initial Deposit
   double absoluteGrowthPct = (g_InitialDeposit > 0) ? (g_PureProfit / g_InitialDeposit) * 100.0 : 0;

   // 4. Get Open Trades Data (Sapu Semua Posisi Terbuka)
   string tradesJson = "[";
   int totalTrades = PositionsTotal();
   double totalFloating = 0;
   
   for(int i=0; i<totalTrades; i++) {
      if(pos.SelectByIndex(i)) {
         string typeStr = (pos.PositionType() == POSITION_TYPE_BUY) ? "BUY" : "SELL";
         double profit = pos.Profit() + pos.Swap() + pos.Commission();
         totalFloating += profit;
         
         tradesJson += "{";
         tradesJson += "\"ticket\":\"" + IntegerToString(pos.Ticket()) + "\",";
         tradesJson += "\"symbol\":\"" + pos.Symbol() + "\",";
         tradesJson += "\"type\":\"" + typeStr + "\",";
         tradesJson += "\"volume\":" + DoubleToString(pos.Volume(), 2) + ",";
         tradesJson += "\"open_price\":" + DoubleToString(pos.PriceOpen(), 5) + ",";
         tradesJson += "\"current_price\":" + DoubleToString(pos.PriceCurrent(), 5) + ",";
         tradesJson += "\"profit\":" + DoubleToString(profit, 2);
         tradesJson += "}";
         
         // Tambahkan koma jika bukan elemen terakhir
         if(i < totalTrades - 1) tradesJson += ",";
      }
   }
   tradesJson += "]";

   // 5. Build Realtime Stats JSON (Data Matang untuk Dashboard)
   string statsJson = "{";
   statsJson += "\"balance\":" + DoubleToString(balance, 2) + ",";
   statsJson += "\"equity\":" + DoubleToString(equity, 2) + ",";
   statsJson += "\"initial_deposit\":" + DoubleToString(g_InitialDeposit, 2) + ",";
   statsJson += "\"additional_deposits\":" + DoubleToString(g_AdditionalDeposits, 2) + ",";
   statsJson += "\"total_withdrawals\":" + DoubleToString(g_TotalWithdrawals, 2) + ",";
   statsJson += "\"pure_profit\":" + DoubleToString(g_PureProfit, 2) + ",";
   statsJson += "\"absolute_growth_percent\":" + DoubleToString(absoluteGrowthPct, 2) + ",";
   statsJson += "\"drawdown_percent\":" + DoubleToString(drawdownPercent, 2) + ",";
   statsJson += "\"margin_level\":" + DoubleToString(marginLevel, 2) + ",";
   statsJson += "\"total_floating\":" + DoubleToString(totalFloating, 2) + ",";
   statsJson += "\"last_update\":" + DoubleToString((double)TimeCurrent() * 1000.0, 0);
   statsJson += "}";

   // 6. Send to Firebase (Kirim ke 2 Cabang Berbeda)
   string basePath = "account_data/" + g_AccountNumber;
   
   HttpPut(basePath + "/realtime_stats", statsJson);
   HttpPut(basePath + "/open_trades", tradesJson);
}

//+------------------------------------------------------------------+
//| Core: Send Daily Snapshot for Heatmap Calendar                   |
//+------------------------------------------------------------------+
void SendDailySnapshot() {
   // 1. Dapatkan waktu saat ini
   datetime currentTime = TimeCurrent();
   MqlDateTime timeStruct;
   TimeToStruct(currentTime, timeStruct);
   
   // 2. Set waktu ke awal hari ini (00:00:00)
   timeStruct.hour = 0;
   timeStruct.min = 0;
   timeStruct.sec = 0;
   datetime startOfDay = StructToTime(timeStruct);
   
   // 3. Ambil riwayat trading HANYA UNTUK HARI INI
   HistorySelect(startOfDay, currentTime);
   
   double dailyProfit = 0;
   double dailyLots = 0;
   double dailyDeposit = 0;
   
   for(int i=0; i<HistoryDealsTotal(); i++) {
      ulong ticket = HistoryDealGetTicket(i);
      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      
      if(dealType == DEAL_TYPE_BUY || dealType == DEAL_TYPE_SELL) {
         dailyProfit += HistoryDealGetDouble(ticket, DEAL_PROFIT) + 
                        HistoryDealGetDouble(ticket, DEAL_SWAP) + 
                        HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         dailyLots += HistoryDealGetDouble(ticket, DEAL_VOLUME);
      }
      else if(dealType == DEAL_TYPE_BALANCE) {
         dailyDeposit += HistoryDealGetDouble(ticket, DEAL_PROFIT);
      }
   }
   
   // 4. Kalkulasi Pertumbuhan Harian (Daily Growth %)
   double currentBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double startOfDayBalance = currentBalance - dailyProfit - dailyDeposit; // Saldo sebelum trading hari ini
   
   // Failsafe agar tidak terbagi oleh nol
   if(startOfDayBalance <= 0) startOfDayBalance = g_InitialDeposit;
   if(startOfDayBalance <= 0) startOfDayBalance = currentBalance;
   
   double dailyGrowthPercent = 0;
   if(startOfDayBalance > 0) {
      dailyGrowthPercent = (dailyProfit / startOfDayBalance) * 100.0;
   }
   
   // 5. Susun JSON Snapshot
   string snapJson = "{";
   snapJson += "\"daily_profit\":" + DoubleToString(dailyProfit, 2) + ",";
   snapJson += "\"daily_growth_percent\":" + DoubleToString(dailyGrowthPercent, 2) + ",";
   snapJson += "\"daily_lots\":" + DoubleToString(dailyLots, 2);
   snapJson += "}";
   
   // 6. Tembak ke Firebase di node khusus "snapshots" dengan nama timestamp ms
   string timestampMs = IntegerToString((long)startOfDay * 1000);
   string snapPath = "account_data/" + g_AccountNumber + "/snapshots/" + timestampMs;
   
   HttpPut(snapPath, snapJson);
}

//+------------------------------------------------------------------+
//| Event Handlers                                                   |
//+------------------------------------------------------------------+
int OnInit() {
   // Bypass untuk Backtester agar tidak buang-buang resource
   if(MQLInfoInteger(MQL_TESTER)) return(INIT_SUCCEEDED);

   g_AccountNumber = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   
   // Hitung ulang deposit bersih saat start
   CalculateCashFlow();
   
   // Set HWM awal = Balance (atau Equity saat ini)
   g_HighWaterMark = MathMax(AccountInfoDouble(ACCOUNT_BALANCE), AccountInfoDouble(ACCOUNT_EQUITY));
   
   Print("Monitor Started [V2]. Initial Depo: $", g_InitialDeposit, " | HWM: $", g_HighWaterMark);
   
   // Timer berdetak sesuai input HeartbeatSeconds (Default 3 Detik)
   EventSetTimer(HeartbeatSeconds);
   
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) { 
   EventKillTimer(); 
   Print("KiroiX Monitor Stopped.");
}

void OnTimer() { 
   if(MQLInfoInteger(MQL_TESTER)) return;
   SendRealtimeData(); 
   SendDailySnapshot(); // <-- MENGIRIM SNAPSHOT HARI INI SECARA REALTIME
}
//+------------------------------------------------------------------+