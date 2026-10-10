"use client";

import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

/**
 * Shares the entry page; link previews (X, Discord, iMessage) show the generated team card.
 * Before lock the card hides player names, so sharing early never reveals a roster.
 */
export function ShareButton({ entryId, text, label = "Share" }: { entryId: string; text: string; label?: string }) {
  const toast = useToast();
  const share = async () => {
    const url = `${window.location.origin}/e/${entryId}`;
    try {
      if (navigator.share) await navigator.share({ title: "My lockin team", text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied. It shows your team card when pasted.", "success");
      }
    } catch {
      /* cancelled */
    }
  };
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" icon="share" onClick={share}>
        {label}
      </Button>
      <a href={`/api/og/entry/${encodeURIComponent(entryId)}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center px-2 text-callout font-medium text-ink-2 hover:text-ink">
        View image
      </a>
    </div>
  );
}
