import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Dashboard EA | KRX Monitoring",
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
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

// Client Layout Wrapper
import AppNavbar from "../components/AppNavbar";

function AppLayout({ children }) {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </>
  );
}