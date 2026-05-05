"use client";
import { useEffect, useRef } from "react";

const EMOJIS = [
  "🏆","🥇","🥈","🥉","🎯","👑","⚡","✨","💫","⭐",
  "🔥","🎲","🎮","🏅","🎖️","💎","🌟","🎪","🃏","🎰",
];

interface Column {
  y: number;
  trail: string[];
  speed: number;
}

const SIZE = 28;
const TRAIL = 16;

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols: Column[] = [];

    function init() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const n = Math.floor(canvas.width / SIZE);
      cols = Array.from({ length: n }, (_, i) => ({
        y: -Math.random() * canvas.height * 1.5,
        trail: Array.from({ length: TRAIL }, () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)]),
        speed: 0.6 + Math.random() * 1.8,
      }));
    }

    init();
    window.addEventListener("resize", init);

    let animId: number;
    let lastTime = 0;
    let frameCount = 0;

    function draw(time: number) {
      const dt = Math.min(time - lastTime, 50); // cap at 50ms to avoid jumps
      lastTime = time;
      frameCount++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "center";

      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        const x = i * SIZE + SIZE / 2;

        for (let j = 0; j < col.trail.length; j++) {
          const y = col.y - j * SIZE;
          if (y < -SIZE || y > canvas.height + SIZE) continue;

          const t = 1 - j / TRAIL;
          const alpha = t * t * t; // cubic fade — sharp head, long tail

          ctx.globalAlpha = alpha;
          ctx.font = `${j === 0 ? SIZE : SIZE - 4}px serif`;

          // Head glows brightest, trail fades to deep green
          if (j === 0) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#00ff88";
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillText(col.trail[j], x, y);
        }

        col.y += col.speed * (dt / 16);

        // Roll in a new emoji at the head every few frames
        if (frameCount % 8 === i % 8) {
          col.trail.unshift(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
          if (col.trail.length > TRAIL) col.trail.length = TRAIL;
        }

        // Reset when fully past the bottom
        if (col.y - TRAIL * SIZE > canvas.height) {
          col.y = -SIZE * (TRAIL + Math.random() * 10);
          col.trail = Array.from({ length: TRAIL }, () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
          col.speed = 0.6 + Math.random() * 1.8;
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.3,
      }}
    />
  );
}
