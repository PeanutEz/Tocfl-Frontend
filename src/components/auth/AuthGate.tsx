"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { TriangleAlert } from "lucide-react";
import LoadingScreen, { LOADING_MIN_MS } from "@/components/ui/LoadingScreen";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { trackUserAction } from "@/lib/tracking";
import LoginScreen from "./LoginScreen";

const UserContext = createContext<User | null>(null);

/** Người dùng đang đăng nhập. Chỉ gọi bên trong <AuthGate>. */
export function useUser(): User {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser() phải được dùng bên trong <AuthGate>.");
  return user;
}

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

/**
 * Bọc một trang cần đăng nhập: chưa đăng nhập thì hiện màn hình đăng nhập,
 * đã đăng nhập thì hiện nội dung và cho phép lấy user qua useUser().
 * Kèm luôn chống sao chép và ghi nhận sự kiện "Login" như bản gốc.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  // undefined = đang kiểm tra phiên đăng nhập
  const [user, setUser] = useState<User | null | undefined>(isFirebaseConfigured ? undefined : null);
  // Giữ màn hình chờ ít nhất LOADING_MIN_MS để hiệu ứng chữ M chạy trọn, không bị chớp
  const [minDelayDone, setMinDelayDone] = useState(false);
  useCopyProtection();

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), LOADING_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (u) => {
      setUser(u);
      if (u) trackUserAction("Login", "Học sinh vừa truy cập vào hệ thống");
    });
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto mt-24 max-w-xl rounded-lg bg-surface p-8 text-base shadow">
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

  if (user === undefined || !minDelayDone) return <LoadingScreen />;

  if (!user) return <LoginScreen />;

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
