"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Loader2, TriangleAlert } from "lucide-react";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { trackUserAction } from "@/lib/tracking";
import LoginScreen from "./LoginScreen";
import MainApp from "./MainApp";

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

/** Hạn chế sao chép nội dung bài học (chuột phải, bôi đen, Ctrl+C/S/U), trừ trong ô nhập liệu. */
function useCopyProtection() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onSelectStart = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "s", "u"].includes(e.key.toLowerCase()) && !isEditable(e.target)) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}

export default function App() {
  // undefined = đang kiểm tra phiên đăng nhập
  const [user, setUser] = useState<User | null | undefined>(isFirebaseConfigured ? undefined : null);
  useCopyProtection();

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (u) => {
      setUser(u);
      if (u) trackUserAction("Login", "Học sinh vừa truy cập vào hệ thống");
    });
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto mt-24 max-w-xl rounded-lg bg-white p-8 text-base shadow">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-danger">
          <TriangleAlert size={22} /> Thiếu cấu hình Firebase
        </div>
        <p>
          Tạo file <code className="rounded bg-page px-1">.env.local</code> theo mẫu{" "}
          <code className="rounded bg-page px-1">.env.example</code> rồi khởi động lại server.
        </p>
      </div>
    );
  }

  if (user === undefined) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-muted">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return user ? <MainApp user={user} /> : <LoginScreen />;
}
