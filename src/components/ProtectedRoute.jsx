"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/context/AuthContext";
import LoadingSkeleton from "./LoadingSkeleton";   // Kita buat juga di bawah

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return null; // Akan redirect otomatis
  }

  return <>{children}</>;
}