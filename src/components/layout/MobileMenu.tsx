"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, LogOut, Settings, UserRound, X, type LucideIcon } from "lucide-react";
import ThemeSwitch from "@/components/ui/ThemeSwitch";

type Props = {
  open: boolean;
  onClose: () => void;
  tabs: { id: string; label: string; icon: LucideIcon }[];
  current: string;
  onSelect: (id: string) => void;
  email: string;
  signingOut: boolean;
  onLogout: () => void;
  onOpenSettings: () => void;
};

/** Menu trượt từ trái cho màn hình nhỏ: chuyển tab, xem tài khoản, đăng xuất. */
export default function MobileMenu({ open, onClose, tabs, current, onSelect, email, signingOut, onLogout, onOpenSettings }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // khoá cuộn trang phía sau
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className={`fixed inset-0 z-[60] sm:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 left-0 flex w-[82%] max-w-[320px] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-brand px-4 py-4 text-white">
          <div>
            <p className="text-lg font-bold leading-tight">Maomi Dictionary</p>
            <p className="text-xs text-white/75">國立臺南大學 NUTN</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-white/15"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Chức năng">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted">Chức năng</p>
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = id === current;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active ? "page" : undefined}
                className={`mb-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold transition ${
                  active ? "bg-brand/10 text-brand" : "text-ink hover:bg-page"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${active ? "bg-brand text-white" : "bg-page text-muted"}`}
                >
                  <Icon size={18} />
                </span>
                <span className="flex-1">{label}</span>
                <ChevronRight size={18} className={active ? "text-brand" : "text-faint"} />
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line px-1 py-1">
          <ThemeSwitch />
        </div>

        <div className="border-t border-line p-4">
          <div className="mb-3 flex items-center gap-3 text-sm text-subtle">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-page text-muted">
              <UserRound size={18} />
            </span>
            <span className="min-w-0 truncate" title={email}>
              {email}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-line py-2.5 text-base font-semibold text-ink transition hover:bg-contrast/5"
          >
            <Settings size={18} />
            Cài đặt
          </button>
          <button
            type="button"
            onClick={onLogout}
            disabled={signingOut}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-line py-2.5 text-base font-semibold text-subtle transition hover:border-danger hover:text-danger disabled:opacity-60"
          >
            <LogOut size={18} />
            {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </aside>
    </div>
  );
}
