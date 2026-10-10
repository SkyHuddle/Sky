"use client";

import { useEffect, useRef, useState } from "react";

export type StreamState = "connecting" | "live" | "reconnecting" | "delayed" | "offline";

/**
 * Subscribes to a Server-Sent Events endpoint and keeps the latest payload. The browser's
 * EventSource reconnects on its own; this tracks the connection honestly so the UI can say
 * "Reconnecting" or "Data delayed" instead of showing stale numbers as if they were live.
 */
export function useLiveStream<T>(url: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [state, setState] = useState<StreamState>("connecting");
  const [receivedAt, setReceivedAt] = useState<number>(() => Date.now());
  const urlRef = useRef(url);
  urlRef.current = url;

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    let es: EventSource | null = new EventSource(url);
    const onUpdate = (e: MessageEvent) => {
      try {
        setData(JSON.parse(e.data) as T);
        setReceivedAt(Date.now());
        setState("live");
      } catch {
        /* ignore a malformed frame; the next one replaces it */
      }
    };
    es.addEventListener("update", onUpdate as EventListener);
    es.addEventListener("delayed", () => setState("delayed"));
    es.onopen = () => setState((s) => (s === "delayed" ? s : "live"));
    es.onerror = () => setState(navigator.onLine ? "reconnecting" : "offline");
    const offline = () => setState("offline");
    const online = () => setState("reconnecting");
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      es?.close();
      es = null;
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, [url]);

  return { data, state, receivedAt };
}

/** "12s ago", "3m ago": ticks every second so the age of the data is always visible. */
export function useAge(since: number | null): string | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (since === null || now === null) return null;
  const s = Math.max(0, Math.round((now - since) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
