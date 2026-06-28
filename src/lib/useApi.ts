"use client";
import { useEffect, useState } from "react";

// /api/* 동일출처 fetch + 10분 자동 갱신.
export function useApi<T = any>(url: string | null): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const load = () =>
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          if (alive) {
            setData(d);
            setLoading(false);
          }
        })
        .catch(() => {
          if (alive) setLoading(false);
        });
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [url]);

  return { data, loading };
}
