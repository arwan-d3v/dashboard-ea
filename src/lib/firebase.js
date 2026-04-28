import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Konfigurasi Firebase krx-modern-dev Anda
const firebaseConfig = {
  apiKey: "AIzaSyBaSpsr-1RSyK0sUtDTp9uGkapwb-vXJA0",
  authDomain: "krx-modern-dev.firebaseapp.com",
  databaseURL: "https://krx-modern-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "krx-modern-dev",
  storageBucket: "krx-modern-dev.firebasestorage.app",
  messagingSenderId: "225123976501",
  appId: "1:225123976501:web:9c205ef34e9aa36391387c"
};

// Singleton pattern: Cek apakah Firebase sudah jalan, jika belum baru di-inisialisasi
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Realtime Database
const db = getDatabase(app);

// Ekspor app dan db agar bisa dipakai di halaman lain (seperti halaman Create License)
export { app, db };

// Ekspor auth agar bisa dipakai di halaman lain (seperti halaman Login)
export const auth = getAuth(app);