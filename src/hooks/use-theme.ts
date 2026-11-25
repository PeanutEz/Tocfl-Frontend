"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/lib/theme";

export type ThemeChoice = "light" | "dark" | "system";

const listeners = new Set<() => void>();

function readChoice(): ThemeChoice {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    // Chưa chọn gì thì mặc định là Sáng
    return t === "dark" || t === "system" ? t : "light";
  } catch {
    return "light";
  }
}

function systemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => cb());
}

/** Lựa chọn giao diện của học viên (Sáng / Tối / Theo máy) và giao diện đang hiển thị thực tế. */
export function useTheme() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "light" as ThemeChoice);
  const resolved = useSyncExternalStore(
    subscribe,
    (): "dark" | "light" => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light" as const,
  );

  // "Theo máy": đổi theo hệ điều hành ngay khi người dùng đổi cài đặt máy
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readChoice() === "system") {
        apply("system");
        notify();
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: ThemeChoice) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Trình duyệt chặn localStorage: vẫn đổi giao diện cho phiên hiện tại
    }
    apply(next);
    notify();
  }, []);

  return { choice, resolved, setTheme };
}
