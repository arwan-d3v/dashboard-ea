import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// 1. Ekspor konfigurasi agar bisa dipinjam oleh 'SecondaryApp' di halaman User Management
export const firebaseConfig = {
  apiKey: "AIzaSyBaSpsr-1RSyK0sUtDTp9uGkapwb-vXJA0",
  authDomain: "krx-modern-dev.firebaseapp.com",
  databaseURL: "https://krx-modern-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "krx-modern-dev",
  storageBucket: "krx-modern-dev.firebasestorage.app",
  messagingSenderId: "225123976501",
  appId: "1:225123976501:web:9c205ef34e9aa36391387c"
};

// 2. Inisialisasi Firebase App utama
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 3. Inisialisasi Database dan Auth
const db = getDatabase(app);
const auth = getAuth(app);

// 4. Ekspor semua variabel penting agar bisa digunakan di seluruh aplikasi
export { app, db, auth };