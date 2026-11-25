"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Eye, EyeOff, GraduationCap, Loader2, Lock, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { firebaseAuth } from "@/lib/firebase";

function describeError(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/invalid-email":
      return "Email chưa đúng định dạng.";
    case "auth/too-many-requests":
      return "Bạn đã thử quá nhiều lần. Vui lòng đợi vài phút rồi đăng nhập lại.";
    case "auth/network-request-failed":
      return "Không kết nối được máy chủ. Kiểm tra lại mạng giúp mình nhé.";
    default:
      return "Email hoặc mật khẩu không đúng.";
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Vui lòng nhập đủ email và mật khẩu.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
      toast.success("Đăng nhập thành công", { description: "Chúc bạn ôn tập hiệu quả!" });
    } catch (err) {
      const message = describeError(err);
      setError(message);
      toast.error("Đăng nhập không thành công", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  const inputWrap =
    "flex items-center gap-3 rounded-md border border-line-strong bg-surface px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20";

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
      <div className="slide-down rounded-lg bg-surface px-6 py-9 text-center shadow-[0_5px_15px_rgba(0,0,0,0.1)] sm:px-8 sm:py-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <GraduationCap size={30} />
        </div>
        <h1 className="text-2xl font-bold text-accent">Maomi Cidian</h1>
        <p className="mb-1 text-base font-medium text-ink">Maomi Chinese Dictionary</p>
        <p className="mb-7 text-base text-muted">Đăng nhập để lưu lại quá trình ôn luyện TOCFL của bạn.</p>

        <form onSubmit={handleSubmit} className="space-y-3 text-left text-base" noValidate>
          <label className={inputWrap}>
            <Mail size={18} className="text-muted" />
            <input
              type="email"
              autoComplete="username"
              placeholder="Email học viên"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent py-2.5 outline-none"
            />
          </label>
          <label className={inputWrap}>
            <Lock size={18} className="text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent py-2.5 outline-none [&::-ms-reveal]:hidden"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="-mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-page hover:text-ink"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent py-2.5 font-bold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-sm text-muted">國立臺南大學 · National University of Tainan</p>
    </div>
  );
}
