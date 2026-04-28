//+------------------------------------------------------------------+
//|                                     KiroiX_Account_Monitor.mq5   |
//|                                  Revisi v1.7 - Integrated Lots   |
//+------------------------------------------------------------------+
#property copyright "KiroiX Labs"
#property version   "1.70"
#property strict

#include <Trade\AccountInfo.mqh>

input string   FirebaseDBURL = "https://kiroi-x-ecosystem-default-rtdb.asia-southeast1.firebasedatabase.app/";
input int      HeartbeatSeconds = 300;
input double   MinEquityChange = 0.50;
input bool     RebuildHistory = true;

// Global Variables
string   g_AccountNumber;
double   g_InitialDeposit = 0;
double   g_LastSentEquity = 0;           
datetime g_LastSentTime = 0;             

// --- Time Utilities (WITA Focused) ---
datetime ToWITA(datetime utc) { return utc + 8 * 3600; }
datetime ToUTC(datetime wita) { return wita - 8 * 3600; }

datetime GetReportingDate(datetime utcTime) {
   datetime wita = ToWITA(utcTime);
   datetime shifted = wita - (7 * 3600); // Shift ke 07:00 WITA
   MqlDateTime tm;
   TimeToStruct(shifted, tm);
   tm.hour = 0; tm.min = 0; tm.sec = 0;
   return StructToTime(tm);
}

datetime ToServerTime(datetime wita) {
   return ToUTC(wita) + (int)(TimeCurrent() - TimeGMT());
}

// --- Data Aggregators ---
double GetClosedProfitInRange(datetime startWITA, datetime endWITA) {
   HistorySelect(ToServerTime(startWITA), ToServerTime(endWITA));
   double profit = 0;
   for(int i=0; i<HistoryDealsTotal(); i++) {
      ulong ticket = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT) {
         profit += HistoryDealGetDouble(ticket, DEAL_PROFIT) +
                   HistoryDealGetDouble(ticket, DEAL_SWAP) +
                   HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      }
   }
   return profit;
}

double GetDailyLotsInRange(datetime startWITA, datetime endWITA) {
   HistorySelect(ToServerTime(startWITA), ToServerTime(endWITA));
   double totalLots = 0;
   for(int i=0; i<HistoryDealsTotal(); i++) {
      ulong ticket = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT) {
         totalLots += HistoryDealGetDouble(ticket, DEAL_VOLUME);
      }
   }
   return totalLots;
}

// --- Network ---
int HttpPut(string path, string json) {
   string cleanURL = FirebaseDBURL;
   if(StringSubstr(cleanURL, StringLen(cleanURL)-1, 1) != "/") cleanURL += "/";
   string url = cleanURL + path + ".json";
   char post[], result[];
   string result_headers;
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post)-1); 
   int res = WebRequest("PUT", url, "Content-Type: application/json\r\n", 5000, post, result, result_headers);
   if(res != 200) Print("Failed to send data [", path, "], code: ", res);
   return res;
}

// --- Core Logic ---
void RebuildHistoricalSnapshots() {
   HistorySelect(0, TimeCurrent());
   double firstDepo = 0;
   for(int i=0; i<HistoryDealsTotal(); i++) {
      ulong t = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(t, DEAL_TYPE) == DEAL_TYPE_BALANCE && HistoryDealGetDouble(t, DEAL_PROFIT) > 0) {
         firstDepo = HistoryDealGetDouble(t, DEAL_PROFIT);
         break;
      }
   }
   if(firstDepo <= 0) firstDepo = AccountInfoDouble(ACCOUNT_BALANCE);
   g_InitialDeposit = firstDepo;

   datetime dayStart = GetReportingDate(ToUTC(TimeCurrent()) - (30 * 86400)); 
   double cumulativeProfit = GetClosedProfitInRange(0, dayStart + (7*3600));

   while(dayStart <= GetReportingDate(TimeGMT())) {
      datetime nextDayStart = dayStart + 86400;
      double dProfit = GetClosedProfitInRange(dayStart + (7*3600), nextDayStart + (7*3600));
      double dLots   = GetDailyLotsInRange(dayStart + (7*3600), nextDayStart + (7*3600));
      
      cumulativeProfit += dProfit;
      double eq = g_InitialDeposit + cumulativeProfit;
      double growth = (g_InitialDeposit > 0) ? (cumulativeProfit / g_InitialDeposit) * 100.0 : 0;
      
      string json = "{";
      json += "\"balance\":" + DoubleToString(eq, 2) + ",";
      json += "\"equity\":" + DoubleToString(eq, 2) + ",";
      json += "\"daily_profit\":" + DoubleToString(dProfit, 2) + ",";
      json += "\"daily_growth_percent\":" + DoubleToString(growth, 2) + ",";
      json += "\"daily_lots\":" + DoubleToString(dLots, 2);
      json += "}";
      
      string tsStr = DoubleToString((double)dayStart * 1000.0, 0);
      HttpPut("account_data/" + g_AccountNumber + "/snapshots/" + tsStr, json);
      dayStart = nextDayStart;
   }
   Print("History Rebuild Complete with Lot Data.");
}

void SendSnapshotRealtime() {
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   datetime nowUTC = TimeGMT();
   
   // Threshold check
   if(MathAbs(equity - g_LastSentEquity) < MinEquityChange && (nowUTC - g_LastSentTime) < HeartbeatSeconds) return;

   datetime reportingDate = GetReportingDate(nowUTC);
   double dProfit = GetClosedProfitInRange(reportingDate + (7*3600), ToWITA(nowUTC)) + (equity - balance);
   double dLots   = GetDailyLotsInRange(reportingDate + (7*3600), ToWITA(nowUTC));
   
   double dGrowth = (g_InitialDeposit > 0) ? (dProfit / g_InitialDeposit) * 100.0 : 0;
   double totalGr = (g_InitialDeposit > 0) ? (equity - g_InitialDeposit) / g_InitialDeposit * 100.0 : 0;
   
   string json = "{";
   json += "\"balance\":" + DoubleToString(balance, 2) + ",";
   json += "\"equity\":" + DoubleToString(equity, 2) + ",";
   json += "\"daily_profit\":" + DoubleToString(dProfit, 2) + ",";
   json += "\"daily_growth_percent\":" + DoubleToString(dGrowth, 2) + ",";
   json += "\"total_growth_percent\":" + DoubleToString(totalGr, 2) + ",";
   json += "\"daily_lots\":" + DoubleToString(dLots, 2);
   json += "}";
   
   string tsStr = DoubleToString((double)reportingDate * 1000.0, 0);
   if(HttpPut("account_data/" + g_AccountNumber + "/snapshots/" + tsStr, json) == 200) {
      g_LastSentEquity = equity;
      g_LastSentTime = nowUTC;
      
      string broker = AccountInfoString(ACCOUNT_SERVER);
      StringReplace(broker, "\"", ""); // Pembersihan karakter JSON
      
      string meta = "{\"last_update\":" + DoubleToString((double)nowUTC * 1000.0, 0) + 
                    ",\"initial_deposit\":" + DoubleToString(g_InitialDeposit, 2) + 
                    ",\"broker\":\"" + broker + "\"}";
      HttpPut("account_data/" + g_AccountNumber + "/metadata", meta);
   }
}

// --- Event Handlers ---
int OnInit() {
   g_AccountNumber = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   if(RebuildHistory) RebuildHistoricalSnapshots();
   EventSetTimer(1);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) { EventKillTimer(); }

void OnTimer() { SendSnapshotRealtime(); }