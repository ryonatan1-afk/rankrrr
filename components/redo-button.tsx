"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetSessionAction } from "@/app/actions";

export function RedoButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRedo() {
    setPending(true);
    await resetSessionAction(slug);
    router.push(`/categories/${slug}/vote`);
  }

  return (
    <button
      onClick={handleRedo}
      disabled={pending}
      className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: pending ? "rgba(52,211,153,0.05)" : "rgba(52,211,153,0.1)",
        color: pending ? "rgba(52,211,153,0.4)" : "#34D399",
        border: "1px solid rgba(52,211,153,0.2)",
        cursor: pending ? "default" : "pointer",
      }}
    >
      {pending ? "⟳" : "↺ Redo"}
    </button>
  );
}
