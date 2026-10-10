"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Notice } from "../ui/primitives";
import { useToast } from "../ui/Toast";

async function post(url: string, body?: unknown, method = "POST") {
  const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message ?? "Something went wrong.");
  return data;
}

export function CreateLeagueForm({ contests, defaultContest }: { contests: { id: string; label: string }[]; defaultContest?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const { league } = await post("/api/leagues", { contestId: f.get("contestId"), name: f.get("name"), description: f.get("description") ?? "", privacy });
      router.push(`/leagues/${league.id}?created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the league");
      setBusy(false);
    }
  }
  if (contests.length === 0) return <Notice>There are no open contests to create a league for right now.</Notice>;
  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div>
        <label htmlFor="contestId" className="mb-1.5 block text-footnote font-medium text-ink-2">
          Contest
        </label>
        <select id="contestId" name="contestId" defaultValue={defaultContest ?? contests[0]!.id} className="h-12 w-full rounded-xl bg-surface px-3 text-[0.9375rem] text-ink focus:outline-none focus:ring-2 focus:ring-accent/60">
          {contests.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-footnote font-medium text-ink-2">
          League name
        </label>
        <input id="name" name="name" required minLength={3} maxLength={40} placeholder="Friday Night CS" className="h-12 w-full rounded-xl bg-surface px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/60" />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-footnote font-medium text-ink-2">
          Description <span className="text-ink-3">(optional)</span>
        </label>
        <textarea id="description" name="description" maxLength={200} rows={2} placeholder="Loser buys the first round." className="w-full rounded-xl bg-surface px-3.5 py-3 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/60" />
      </div>
      <fieldset>
        <legend className="mb-1.5 text-footnote font-medium text-ink-2">Who can join</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["private", "Invite link only", "Friends with the link"],
              ["public", "Public", "Listed on the event page"],
            ] as const
          ).map(([k, title, sub]) => (
            <button
              type="button"
              key={k}
              onClick={() => setPrivacy(k)}
              aria-pressed={privacy === k}
              className={cn("rounded-xl border p-3 text-left", privacy === k ? "border-accent/60 bg-accent-soft" : "border-border bg-surface hover:border-border-strong")}
            >
              <span className="block text-callout font-semibold text-ink">{title}</span>
              <span className="block text-caption text-ink-2">{sub}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <Button type="submit" size="lg" block loading={busy}>
        Create league
      </Button>
      <p className="text-center text-footnote text-ink-3">Your existing team joins automatically. Nobody has to build a second roster.</p>
    </form>
  );
}

export function JoinByCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const c = code.trim().split("/").pop();
        if (c) router.push(`/join/${encodeURIComponent(c)}`);
      }}
      className="flex gap-2"
    >
      <label className="sr-only" htmlFor="code">
        Invite code or link
      </label>
      <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste an invite link or code" className="h-11 min-w-0 flex-1 rounded-xl bg-elevated px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/60" />
      <Button type="submit" variant="secondary" disabled={!code.trim()}>
        Join
      </Button>
    </form>
  );
}

export function InviteLink({ code }: { code: string }) {
  const toast = useToast();
  const [url, setUrl] = useState(`/join/${code}`);
  useEffect(() => setUrl(`${window.location.origin}/join/${code}`), [code]);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-elevated p-1.5 pl-3.5">
      <Icon name="link" size={16} className="shrink-0 text-ink-3" />
      <span className="min-w-0 flex-1 truncate text-callout text-ink-2" data-testid="invite-url">
        {url}
      </span>
      <Button
        size="sm"
        icon="copy"
        onClick={async () => {
          try {
            if (navigator.share && /Mobi/.test(navigator.userAgent)) await navigator.share({ title: "Join my Lockin league", url });
            else {
              await navigator.clipboard.writeText(url);
              toast("Invite link copied", "success");
            }
          } catch {
            /* cancelled */
          }
        }}
      >
        Copy
      </Button>
    </div>
  );
}

export function JoinButton({ code, leagueId, signedIn, next }: { code?: string; leagueId?: string; signedIn: boolean; next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!signedIn) {
    return (
      <Button size="lg" block onClick={() => router.push(`/signup?next=${encodeURIComponent(next)}`)}>
        Create an account to join
      </Button>
    );
  }
  return (
    <div className="space-y-3">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Button
        size="lg"
        block
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const r = code ? await post("/api/leagues/join", { code }) : await post(`/api/leagues/${encodeURIComponent(leagueId!)}/join`);
            router.push(`/leagues/${r.leagueId}?joined=1`);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't join");
            setBusy(false);
          }
        }}
      >
        Join league
      </Button>
    </div>
  );
}

export function LeaveLeague({ leagueId }: { leagueId: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (!confirm("Leave this league? Your team stays in the contest.")) return;
        try {
          await post(`/api/leagues/${encodeURIComponent(leagueId)}/leave`);
          router.push("/leagues");
          router.refresh();
        } catch (e) {
          toast(e instanceof Error ? e.message : "Couldn't leave", "error");
        }
      }}
    >
      Leave league
    </Button>
  );
}

export function RemoveMember({ leagueId, userId, username }: { leagueId: string; userId: string; username: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <button
      className="text-caption font-medium text-ink-3 hover:text-negative"
      onClick={async () => {
        if (!confirm(`Remove ${username} from the league? Their team stays in the contest.`)) return;
        try {
          await post(`/api/leagues/${encodeURIComponent(leagueId)}/members/${encodeURIComponent(userId)}`, undefined, "DELETE");
          toast(`${username} removed`, "success");
          router.refresh();
        } catch (e) {
          toast(e instanceof Error ? e.message : "Couldn't remove member", "error");
        }
      }}
    >
      Remove
    </button>
  );
}
