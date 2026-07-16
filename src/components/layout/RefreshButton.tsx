"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function refresh() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "갱신 실패");
      const parts = Object.entries(json.results as Record<string, { source: string; rowCount: number }>).map(
        ([name, r]) => `${name} ${r.rowCount}건(${r.source})`,
      );
      setMessage(parts.join(" · "));
      setState("done");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "갱신 실패");
      setState("error");
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={refresh}
        disabled={state === "loading"}
        className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold tracking-[0.3px] text-on-primary transition-colors hover:bg-primary-pressed active:bg-primary-active disabled:bg-surface-soft disabled:text-ash"
      >
        {state === "loading" ? "갱신 중…" : "데이터 새로고침"}
      </button>
      {message && (
        <span className={`text-xs ${state === "error" ? "text-warning" : "text-mute"}`}>{message}</span>
      )}
    </span>
  );
}
