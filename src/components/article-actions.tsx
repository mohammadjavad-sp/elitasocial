"use client";

import { useEffect, useRef, useState } from "react";

export function ArticleActions({ title }: { title: string }) {
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const fallbackInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!fallbackUrl) return;
    fallbackInput.current?.focus();
    fallbackInput.current?.select();
  }, [fallbackUrl]);

  function showFallback(url: string) {
    setFallbackUrl(url);
    setStatus("لینک را از کادر زیر انتخاب و کپی کن.");
    if (fallbackUrl === url) {
      fallbackInput.current?.focus();
      fallbackInput.current?.select();
    }
  }

  async function copyLink() {
    const url = window.location.href;
    setBusy(true);
    setStatus("");
    try {
      if (!navigator.clipboard?.writeText) {
        showFallback(url);
        return;
      }
      await navigator.clipboard.writeText(url);
      setFallbackUrl("");
      setStatus("لینک مقاله کپی شد.");
    } catch {
      showFallback(url);
    } finally {
      setBusy(false);
    }
  }

  async function shareArticle() {
    setStatus("");
    if (typeof navigator.share !== "function") {
      showFallback(window.location.href);
      return;
    }
    try {
      await navigator.share({ title, url: window.location.href });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showFallback(window.location.href);
    }
  }

  return (
    <div className="article-actions">
      <div className="article-action-buttons" role="group" aria-label="اشتراک‌گذاری مقاله">
        <button type="button" onClick={copyLink} disabled={busy}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></svg>
          {busy ? "در حال کپی…" : "کپی لینک مقاله"}
        </button>
        {canShare && <button type="button" onClick={shareArticle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2" /></svg>
          اشتراک‌گذاری
        </button>}
      </div>
      <p className="article-action-status" role="status" aria-live="polite">{status}</p>
      {fallbackUrl && <label className="article-url-fallback">لینک این مقاله<input ref={fallbackInput} type="text" dir="ltr" readOnly value={fallbackUrl} onFocus={(event) => event.currentTarget.select()} /></label>}
    </div>
  );
}
