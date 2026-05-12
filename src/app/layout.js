import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { Toaster } from "sonner";
import ClientLayoutWrapper from "../components/ClientLayoutWrapper"; // <-- Import Wrapper Baru

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Dashboard | KRX Monitoring",
  description: "Professional Expert Advisor Management System - License, Analytics & Real-time Control",
  keywords: ["expert advisor", "mt5", "mql5", "trading dashboard", "license manager"],
  authors: [{ name: "Arwan Dev" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            {/* Bungkus children dengan Wrapper yang pintar membaca rute */}
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}