"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "rankr_howto_seen";

export default function HowToModal() {
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (visible) closeRef.current?.focus();
  }, [visible]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
      if (e.key === "Tab") {
        // trap focus inside modal
        const panel = document.getElementById("howto-panel");
        if (!panel) return;
        const focusable = panel.querySelectorAll<HTMLElement>("button, [href], input, [tabindex]:not([tabindex='-1'])");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-title"
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9000, padding: "20px",
      }}
    >
      <div
        id="howto-panel"
        style={{
          position: "relative",
          background: "#13131A",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "28px 28px 24px",
          width: "100%", maxWidth: 400,
          animation: "fadeup 0.3s ease forwards",
        }}
      >
        <button
          ref={closeRef}
          onClick={dismiss}
          aria-label="Close instructions"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "rgba(255,255,255,0.5)",
            width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, lineHeight: 1,
          }}
        >
          ×
        </button>

        <h2 id="howto-title" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 10 }}>
          Pick your favourite.
        </h2>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 24 }}>
          You&apos;ll see two items at a time. Keep picking the one you prefer — the best one rises to the top. 16 items, 14 quick matchups.
        </p>

        <button
          onClick={dismiss}
          style={{
            width: "100%", padding: "13px", borderRadius: 12,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            border: "none", color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
          }}
        >
          Let&apos;s go →
        </button>
      </div>
    </div>
  );
}
