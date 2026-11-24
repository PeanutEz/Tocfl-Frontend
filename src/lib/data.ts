"use client";

import { useEffect, useState } from "react";
import type { Dialogue, Exam, Word } from "./types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Đổi đường dẫn tương đối trong dữ liệu (vd: "images/Test_01/q1_A.png") thành URL có basePath. */
export function asset(path?: string): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${basePath}/${path.replace(/^\.?\//, "")}`;
}

const cache = new Map<string, Promise<unknown>>();

function loadJson<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    const request = fetch(asset(`data/${file}`)).then((res) => {
      if (!res.ok) throw new Error(`Không tải được ${file} (${res.status})`);
      return res.json();
    });
    request.catch(() => cache.delete(file)); // cho phép thử lại
    cache.set(file, request);
  }
  return cache.get(file) as Promise<T>;
}

export const loadDictionary = () =>
  Promise.all([loadJson<Word[]>("dictionary-a1.json"), loadJson<Word[]>("dictionary-a2.json")]).then(
    ([a1, a2]) => [...a1, ...a2],
  );

export const loadDialogues = () => loadJson<Dialogue[]>("dialogues.json");

export const loadExam = (id: string) => loadJson<Exam>(`exams/${id}.json`);

type AsyncState<T> = { data: T | null; error: Error | null };

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null });

  useEffect(() => {
    let active = true;
    setState({ data: null, error: null });
    loader()
      .then((data) => active && setState({ data, error: null }))
      .catch((error: Error) => active && setState({ data: null, error }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
