"use client";

import { useEffect, useState } from "react";

export type AsyncState<T> = { data: T | null; error: Error | null };

/** Chạy một hàm trả về Promise khi `deps` đổi; trả về { data, error } (data = null khi đang tải). */
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
