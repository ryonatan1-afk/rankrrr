"use client";

import { useState, useTransition } from "react";
import { updateCategoryStatus, updateCategoryMeta } from "./actions";

type Status = "ACTIVE" | "HIDDEN" | "DELETED";

interface Category {
  id: string;
  name: string;
  emoji: string | null;
  status: Status;
  createdAt: Date;
  _count: { votes: number; items: number };
  author: { email: string } | null;
}

const STATUS_STYLES: Record<Status, { bg: string; color: string; border: string; label: string }> = {
  ACTIVE:  { bg: "rgba(52,211,153,0.1)",  color: "var(--green)", border: "rgba(52,211,153,0.3)",  label: "Active"  },
  HIDDEN:  { bg: "rgba(251,191,36,0.1)",  color: "#FBBF24", border: "rgba(251,191,36,0.3)",  label: "Hidden"  },
  DELETED: { bg: "rgba(248,113,113,0.1)", color: "var(--red)", border: "rgba(248,113,113,0.3)", label: "Deleted" },
};

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLES[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

function CategoryRow({ cat }: { cat: Category }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [emoji, setEmoji] = useState(cat.emoji ?? "");

  function handleStatus(status: Status) {
    startTransition(() => updateCategoryStatus(cat.id, status));
  }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateCategoryMeta(cat.id, name.trim(), emoji.trim());
      setEditing(false);
    });
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "14px 16px",
      opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

        {/* Emoji + name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                aria-label="Category emoji"
                style={{
                  width: 44, textAlign: "center", fontSize: 18,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8, padding: "6px 4px", color: "#fff",
                }}
              />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                aria-label="Category name"
                style={{
                  flex: 1, fontSize: 14, fontWeight: 600,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8, padding: "6px 10px", color: "#fff",
                }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{cat.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em" }}>{cat.name}</span>
              <StatusBadge status={cat.status} />
            </div>
          )}

          <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>
            <span>{cat._count.votes} votes</span>
            <span>{cat._count.items} items</span>
            {cat.author && <span>by {cat.author.email}</span>}
            <span>{new Date(cat.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {editing ? (
            <>
              <ActionButton onClick={handleSave} color="var(--green)">Save</ActionButton>
              <ActionButton onClick={() => { setEditing(false); setName(cat.name); setEmoji(cat.emoji ?? ""); }}>Cancel</ActionButton>
            </>
          ) : (
            <>
              <ActionButton onClick={() => setEditing(true)}>Edit</ActionButton>
              {cat.status !== "ACTIVE"  && <ActionButton onClick={() => handleStatus("ACTIVE")}  color="var(--green)">Active</ActionButton>}
              {cat.status !== "HIDDEN"  && <ActionButton onClick={() => handleStatus("HIDDEN")}  color="#FBBF24">Hide</ActionButton>}
              {cat.status !== "DELETED" && <ActionButton onClick={() => handleStatus("DELETED")} color="var(--red)">Delete</ActionButton>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ onClick, color, children }: {
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
        background: color ? `${color}18` : "rgba(255,255,255,0.05)",
        border: `1px solid ${color ? `${color}40` : "rgba(255,255,255,0.08)"}`,
        color: color ?? "rgba(255,255,255,0.5)",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// Filter bar
const FILTERS: { label: string; value: Status | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Hidden", value: "HIDDEN" },
  { label: "Deleted", value: "DELETED" },
];

export default function AdminClient({ categories }: { categories: Category[] }) {
  const [filter, setFilter] = useState<Status | "ALL">("ALL");

  const visible = filter === "ALL" ? categories : categories.filter(c => c.status === filter);

  const counts = {
    ALL: categories.length,
    ACTIVE: categories.filter(c => c.status === "ACTIVE").length,
    HIDDEN: categories.filter(c => c.status === "HIDDEN").length,
    DELETED: categories.filter(c => c.status === "DELETED").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
              background: filter === f.value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filter === f.value ? "rgba(99,102,241,0.4)" : "var(--border)"}`,
              color: filter === f.value ? "#818CF8" : "rgba(255,255,255,0.4)",
              transition: "all 0.15s",
            }}
          >
            {f.label} <span style={{ opacity: 0.6 }}>{counts[f.value]}</span>
          </button>
        ))}
      </div>

      {/* Category rows */}
      {visible.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          No categories with this status.
        </div>
      ) : (
        visible.map(cat => <CategoryRow key={cat.id} cat={cat} />)
      )}
    </div>
  );
}
