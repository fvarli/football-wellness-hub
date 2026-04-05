"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";

interface SessionActionsProps {
  sessionId: string;
  editHref: string;
}

export default function SessionActions({ sessionId, editHref }: SessionActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded px-2 py-1 text-[11px] font-medium text-white bg-danger hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-1 text-[11px] font-medium text-muted bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <a href={editHref} className="rounded p-1 text-muted hover:bg-gray-100 hover:text-foreground transition-colors">
        <Pencil className="h-3.5 w-3.5" />
      </a>
      <button onClick={() => setConfirming(true)} className="rounded p-1 text-muted hover:bg-red-50 hover:text-danger transition-colors">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
