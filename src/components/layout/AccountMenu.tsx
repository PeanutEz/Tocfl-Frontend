"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Loader2, LogOut, Settings, UserRound } from "lucide-react";
import ThemeSwitch from "@/components/ui/ThemeSwitch";

type Props = {
  email: string;
  signingOut: boolean;
  onLogout: () => void;
  onOpenSettings: () => void;
};

/** Nút tài khoản trên header (màn hình lớn): bấm để mở menu thả xuống. */
export default function AccountMenu({ email, signingOut, onLogout, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    firstItemRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={`flex cursor-pointer items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm text-white transition hover:bg-white/15 ${
          open ? "bg-white/15" : ""
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <UserRound size={18} />
        </span>
        <span className="max-w-[240px] truncate font-medium" title={email}>
          {email}
        </span>
        <ChevronDown size={16} className={`opacity-80 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label="Tài khoản"
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-line bg-surface text-left text-ink shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <UserRound size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" title={email}>
              {email}
            </p>
            <p className="text-xs text-muted">Đang đăng nhập</p>
          </div>
        </div>

        <div className="border-b border-line px-1 py-1">
          <ThemeSwitch />
        </div>

        <div className="p-1.5">
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-contrast/5 focus-visible:bg-contrast/5 focus-visible:outline-none"
          >
            <Settings size={17} />
            Cài đặt
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            disabled={signingOut}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-danger/10 hover:text-danger focus-visible:bg-danger/10 focus-visible:text-danger focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            {signingOut ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
            {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}
