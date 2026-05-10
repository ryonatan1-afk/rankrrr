"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateCategoryStatus, updateCategoryMeta, updateFeaturedDate, destroyCategory, getCategoryItems, refreshItemImage, setItemImageUrl } from "./actions";

type Status = "ACTIVE" | "HIDDEN" | "DELETED";

interface Category {
  id: string;
  name: string;
  emoji: string | null;
  status: Status;
  createdAt: Date;
  featuredDate: Date | null;
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
  const [isPendingDate, startDateTransition] = useTransition();
  const [confirmDestroy, setConfirmDestroy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [emoji, setEmoji] = useState(cat.emoji ?? "");
  const [dateValue, setDateValue] = useState(
    cat.featuredDate ? new Date(cat.featuredDate).toISOString().slice(0, 10) : ""
  );

  function handleSetDaily() {
    startDateTransition(() => updateFeaturedDate(cat.id, dateValue || null));
  }

  function handleClearDaily() {
    setDateValue("");
    startDateTransition(() => updateFeaturedDate(cat.id, null));
  }

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
          {/* Daily date picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap", opacity: isPendingDate ? 0.6 : 1 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Daily:</span>
            <input
              type="date"
              value={dateValue}
              onChange={e => setDateValue(e.target.value)}
              aria-label="Set as daily category date"
              style={{
                fontSize: 11.5, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
                color: dateValue ? "#fff" : "rgba(255,255,255,0.25)", padding: "3px 8px",
                colorScheme: "dark",
              }}
            />
            <ActionButton onClick={handleSetDaily} color="#818CF8">Set Daily</ActionButton>
            {cat.featuredDate && (
              <ActionButton onClick={handleClearDaily}>Clear</ActionButton>
            )}
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
              {confirmDestroy ? (
                <>
                  <ActionButton color="var(--red)" onClick={() => startTransition(() => destroyCategory(cat.id))}>Confirm</ActionButton>
                  <ActionButton onClick={() => setConfirmDestroy(false)}>Cancel</ActionButton>
                </>
              ) : (
                <ActionButton color="var(--red)" onClick={() => setConfirmDestroy(true)}>🗑 Destroy</ActionButton>
              )}
            </>
          )}
        </div>
      </div>
      <ItemsPanel categoryId={cat.id} categoryName={cat.name} />
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

type AdminItem = { id: string; name: string; emoji: string | null; imageUrl: string | null };

function ItemRow({ item, categoryName }: { item: AdminItem; categoryName: string }) {
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const result = await refreshItemImage(item.id);
      setImageUrl(result.imageUrl ?? "");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleSaveUrl() {
    startSaveTransition(() => setItemImageUrl(item.id, imageUrl));
  }

  const busy = isRefreshing || isSaving;
  const displayUrl = imageUrl || null;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
      opacity: busy ? 0.6 : 1, transition: "opacity 0.15s",
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 8, flexShrink: 0, overflow: "hidden",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
      }}>
        {displayUrl && (
          <Image src={displayUrl} alt={item.name} fill sizes="52px" style={{ objectFit: "cover" }} unoptimized />
        )}
      </div>

      {/* Name + controls */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          {item.emoji} {item.name}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Paste image URL…"
            style={{
              flex: 1, minWidth: 140, fontSize: 11, padding: "4px 8px", borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          />
          <ActionButton onClick={handleSaveUrl} color="var(--green)">{isSaving ? "Saving…" : "Save"}</ActionButton>
          <ActionButton onClick={handleRefresh} color="#818CF8">{isRefreshing ? "…" : "🔄 AI Fix"}</ActionButton>
        </div>
      </div>
    </div>
  );
}

function ItemsPanel({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getCategoryItems(categoryId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  if (items === null) {
    return (
      <button
        onClick={load}
        disabled={loading}
        style={{
          marginTop: 10, fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
          cursor: loading ? "default" : "pointer",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.4)", transition: "all 0.15s",
        }}
      >
        {loading ? "Loading…" : "▸ View Items"}
      </button>
    );
  }

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Items ({items.length})
        </span>
        <button
          onClick={() => setItems(null)}
          style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}
        >
          ▴ Hide
        </button>
      </div>
      {items.map(item => (
        <ItemRow key={item.id} item={item} categoryName={categoryName} />
      ))}
    </div>
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
