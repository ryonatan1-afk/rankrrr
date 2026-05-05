"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "rankr_onboarding_dismissed";

const FEATURES = [
  { icon: "⚔️", title: "1v1 Brackets", desc: "7 votes, clean tournament." },
  { icon: "📊", title: "Crowd Rankings", desc: "Aggregate of all voters." },
  { icon: "✨", title: "AI Categories", desc: "Generate any topic instantly." },
];

export default function OnboardingTip() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
    }, 350);
  }

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes onboarding-in {
          0%   { opacity: 0; transform: translateY(-12px) scale(0.97); }
          60%  { opacity: 1; transform: translateY(3px) scale(1.005); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes onboarding-out {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-8px) scale(0.97); }
        }
        @keyframes x-pulse {
          0%   { box-shadow: 0 0 0 0px rgba(99,102,241,0.6); color: rgba(255,255,255,0.55); }
          50%  { box-shadow: 0 0 0 6px rgba(99,102,241,0); color: rgba(255,255,255,0.9); }
          100% { box-shadow: 0 0 0 0px rgba(99,102,241,0); color: rgba(255,255,255,0.25); }
        }
        @keyframes x-sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        .onboarding-x {
          animation: x-pulse 0.7s ease-out 1.2s 3 forwards;
        }
        .onboarding-x:hover {
          color: rgba(255,255,255,0.9) !important;
          animation: none;
        }
      `}</style>

      <div style={{
        width: "100%",
        background: "rgba(99,102,241,0.06)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 16,
        padding: "14px 16px",
        animation: leaving
          ? "onboarding-out 0.35s ease forwards"
          : "onboarding-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>

          {/* Feature list — each item fades in with a stagger */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  animation: `fadein 0.4s ease ${0.4 + i * 0.12}s both`,
                  opacity: 0,
                }}
              >
                <span style={{ fontSize: 15 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ✕ button — pulses after content appears to signal dismissal */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={dismiss}
              className="onboarding-x"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.25)", fontSize: 14, lineHeight: 1,
                padding: "4px 6px", borderRadius: 6,
                transition: "color 0.15s",
              }}
              aria-label="Dismiss"
            >
              ✕
            </button>
            {/* Sparkle dots that appear around the ✕ */}
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: 4, height: 4,
                borderRadius: "50%",
                background: "#818CF8",
                pointerEvents: "none",
                transform: `rotate(${i * 90}deg) translate(10px)`,
                animation: `x-sparkle 0.5s ease ${1.2 + i * 0.08}s 3 forwards`,
                opacity: 0,
              }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
