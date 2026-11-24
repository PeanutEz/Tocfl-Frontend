import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Giá trị lấy từ .env.local (xem .env.example). Next.js chỉ nhúng biến NEXT_PUBLIC_* khi được
// gọi đúng tên đầy đủ, nên không thể đọc động qua process.env[key].
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Thiếu cấu hình Firebase. Hãy tạo .env.local theo mẫu .env.example.");
  }
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function firebaseAuth(): Auth {
  return getAuth(getApp());
}

export function firestore(): Firestore {
  return getFirestore(getApp());
}
