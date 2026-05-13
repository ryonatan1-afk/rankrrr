"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCategoryAction, createCategoryAction, suggestReplacementItem } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";
import type { GeneratedCategory } from "@/lib/ai/generate-category";

const PLACEHOLDER_EXAMPLES = [
  "e.g. Pizza toppings",
  "Be specific: '90s sitcoms' beats 'TV shows'",
  "Be specific: 'Pixar films' beats 'animated movies'",
  "Be specific: 'hip-hop albums from the 2000s' beats 'rap music'",
  "Be specific: 'Italian pasta dishes' beats 'Italian food'",
  "Be specific: 'Premier League clubs' beats 'football teams'",
];

export default function NewCategoryPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [placeholder] = useState(
    () => PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)]
  );
  const [phase, setPhase] = useState<"input" | "generating" | "preview" | "saving">("input");
  const [preview, setPreview] = useState<GeneratedCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setError(null);
    setPhase("generating");
    try {
      const result = await generateCategoryAction(topic.trim());
      setPreview(result);
      setPhase("preview");
    } catch (e) {
      setError("Generation failed. Try a different topic.");
      setPhase("input");
    }
  }

  async function handleReplaceItem(index: number) {
    if (!preview || replacingIndex !== null) return;
    setReplacingIndex(index);
    try {
      const existingNames = preview.items.map(item => item.name);
      const replacement = await suggestReplacementItem(
        preview.name,
        existingNames,
        preview.items[index].name,
      );
      setPreview(prev => {
        if (!prev) return prev;
        const items = [...prev.items];
        items[index] = replacement;
        return { ...prev, items };
      });
    } catch {
      // silently leave item unchanged — user can retry
    } finally {
      setReplacingIndex(null);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setPhase("saving");
    try {
      const { slug } = await createCategoryAction(preview);
      trackEvent("category_created", { category_name: preview.name, category_slug: slug });
      router.push(`/categories/${slug}/vote`);
    } catch (e) {
      setError("Failed to save. Please try again.");
      setPhase("preview");
    }
  }

  return (
    <main className="flex-1 px-5 py-10">
      <div className="min-w-0 flex flex-col gap-8" style={{ maxWidth: 576, margin: "0 auto" }}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight">New Category</span>
        </div>

        {/* Input phase */}
        {(phase === "input" || phase === "generating") && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 28, marginBottom: 10 }}>✨</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 6 }}>
                Generate with AI
              </h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
                Type any topic. The more specific, the better. Claude builds 16 items across 2 brackets.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label
                htmlFor="category-topic"
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--muted)",
                }}
              >
                Topic
              </label>
              <input
                id="category-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder={placeholder}
                disabled={phase === "generating"}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  fontSize: 15,
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />

              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || phase === "generating"}
                style={{
                  background: phase === "generating" ? "rgba(99,102,241,0.4)" : "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: phase === "generating" ? "default" : "pointer",
                  boxShadow: phase === "generating" ? "none" : "0 4px 20px var(--accent-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.18s ease",
                }}
              >
                {phase === "generating" ? (
                  <>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                    Generating…
                  </>
                ) : (
                  "Generate →"
                )}
              </button>
            </div>

            {error && (
              <div style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--red)",
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Preview phase */}
        {(phase === "preview" || phase === "saving") && preview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Category header */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "22px 22px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <span style={{ fontSize: 30 }}>{preview.emoji}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em" }}>{preview.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{preview.description}</div>
                </div>
              </div>
            </div>

            {/* Actions — above the fold before the item list */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={phase === "saving" || replacingIndex !== null}
                style={{
                  flex: 1,
                  background: phase === "saving" ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.15)",
                  color: "var(--green)",
                  border: "1px solid rgba(52,211,153,0.3)",
                  borderRadius: 12,
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: (phase === "saving" || replacingIndex !== null) ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.18s ease",
                }}
              >
                {phase === "saving" ? (
                  <>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                    Saving…
                  </>
                ) : (
                  "Save & Start Voting →"
                )}
              </button>
              <button
                onClick={() => { setPhase("input"); setPreview(null); }}
                disabled={phase === "saving" || replacingIndex !== null}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--muted)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "13px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ↺ Regenerate
              </button>
            </div>

            {error && (
              <div style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--red)",
              }}>
                {error}
              </div>
            )}

            {/* Items grid — scrollable preview below the CTA */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {preview.items.map((item, i) => {
                const isThisReplacing = replacingIndex === i;
                const anyReplacing = replacingIndex !== null;
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--surface)",
                      border: `1px solid ${isThisReplacing ? "rgba(99,102,241,0.35)" : "var(--border)"}`,
                      borderRadius: 14,
                      padding: "12px 12px 12px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      animation: "fadeup 0.3s ease forwards",
                      animationDelay: `${i * 0.04}s`,
                      opacity: isThisReplacing ? 0.7 : anyReplacing && !isThisReplacing ? 0.4 : 0,
                      transition: "opacity 0.15s, border-color 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>
                      {isThisReplacing ? "⟳" : item.emoji}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 650, letterSpacing: "-0.02em" }}>
                        {isThisReplacing ? "Finding replacement…" : item.name}
                      </div>
                      {!isThisReplacing && (
                        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleReplaceItem(i)}
                      disabled={anyReplacing || phase === "saving"}
                      aria-label={`Replace ${item.name}`}
                      style={{
                        flexShrink: 0,
                        fontSize: 13,
                        lineHeight: 1,
                        padding: "4px 7px",
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                        color: anyReplacing ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.35)",
                        cursor: anyReplacing || phase === "saving" ? "default" : "pointer",
                        transition: "color 0.15s",
                        marginTop: 1,
                      }}
                    >
                      ↺
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}