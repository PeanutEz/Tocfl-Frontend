"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { Toaster } from "sonner";
import { useTheme, type ThemeChoice } from "@/hooks/use-theme";

const OPTIONS: { id: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { id: "light", label: "Sáng", icon: Sun },
  { id: "dark", label: "Tối", icon: Moon },
  { id: "system", label: "Theo máy", icon: Monitor },
];

/** Nhóm 3 nút chọn giao diện, dùng trong menu tài khoản và menu mobile. */
export default function ThemeSwitch() {
  const { choice, setTheme } = useTheme();
  return (
    <div className="px-3 py-2">
      <p className="mb-1.5 text-xs font-semibold text-muted">Giao diện</p>
      <div role="radiogroup" aria-label="Giao diện" className="grid grid-cols-3 gap-1 rounded-md bg-soft p-1">
        {OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = choice === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(id)}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[13px] font-semibold transition ${
                active ? "bg-surface text-brand shadow-sm" : "text-subtle hover:text-ink"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Toaster của sonner đổi màu theo giao diện đang hiển thị. */
export function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="top-right"
      richColors
      closeButton
      duration={3500}
      toastOptions={{ style: { fontSize: 15 } }}
    />
  );
}
