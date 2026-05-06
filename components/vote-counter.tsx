"use client";

import { useEffect, useState, useRef, Fragment } from "react";

export function VoteCounter({ total }: { total: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (total === 0) return;
    const duration = 1800;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * total));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [total]);

  const digits = String(display).padStart(6, "0").split("");

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96%            { opacity: 0.85; }
          98%            { opacity: 0.92; }
        }
        .retro-digit {
          animation: flicker 6s infinite;
        }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        padding: "20px 28px",
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(0,255,65,0.15)",
        borderRadius: 16,
        boxShadow: "0 0 40px rgba(0,255,65,0.05), inset 0 0 30px rgba(0,0,0,0.5)",
        position: "relative", overflow: "hidden",
      }}>

        {/* Scanlines overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
          animation: "scanline 0.2s linear infinite",
          borderRadius: "inherit",
        }} />

        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.3em",
          color: "rgba(0,255,65,0.45)", fontFamily: "monospace",
          textTransform: "uppercase",
        }}>
          ⚡ Total Votes Cast
        </div>

        {/* Digit display */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {digits.map((d, i) => (
            <Fragment key={i}>
              {i === 3 && (
                <span style={{
                  color: "rgba(0,255,65,0.35)", fontSize: 22,
                  fontFamily: "monospace", marginBottom: 4, lineHeight: 1,
                }}>
                  ,
                </span>
              )}
              <div
                className="retro-digit"
                style={{
                  animationDelay: `${i * 0.4}s`,
                  width: 32, height: 44,
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(0,255,65,0.2)",
                  borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 700,
                  fontFamily: "'Courier New', Courier, monospace",
                  color: "#00ff41",
                  textShadow: "0 0 8px #00ff41, 0 0 20px rgba(0,255,65,0.4)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
                  letterSpacing: 0,
                  userSelect: "none",
                }}
              >
                {d}
              </div>
            </Fragment>
          ))}
        </div>

        <div style={{
          fontSize: 9, color: "rgba(0,255,65,0.25)", fontFamily: "monospace",
          letterSpacing: "0.2em",
        }}>
          AND COUNTING
        </div>
      </div>
    </>
  );
}
