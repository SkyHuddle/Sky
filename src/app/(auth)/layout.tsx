import { Brand } from "@/components/shell/Brand";
import { PlayerAvatar } from "@/components/ui/identity";
import type { TeamLite } from "@/server/queries/common";

// Illustrated, fictional players: the same art style as the demo universe, never a real person.
const CAST: Array<{ seed: string; team: TeamLite }> = [
  { seed: "auth-1", team: { id: "a1", name: "Ember", acronym: "EMB", color: "#e2703a", country: "" } },
  { seed: "auth-2", team: { id: "a2", name: "Cobalt", acronym: "COB", color: "#3f6fd8", country: "" } },
  { seed: "auth-3", team: { id: "a3", name: "Juniper", acronym: "JUN", color: "#4fbf8f", country: "" } },
  { seed: "auth-4", team: { id: "a4", name: "Static", acronym: "STA", color: "#d0548f", country: "" } },
  { seed: "auth-5", team: { id: "a5", name: "Lumen", acronym: "LMN", color: "#d9b44a", country: "" } },
];

const POINTS = ["Pick five pros under a salary cap", "Score from their real maps, after every map", "Transfer between stages and beat your friends"];

/**
 * Sign-in and sign-up: a brand moment, then the form. Phones get a compact hero above the form;
 * desktop splits into an art panel and the form side by side.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative overflow-hidden bg-surface px-5 pt-5 pb-7 lg:flex lg:flex-col lg:px-12 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_100%_0%,rgb(79_224_196/0.16),transparent_70%)]" aria-hidden />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative mt-7 lg:my-auto">
          <ul className="flex -space-x-3" aria-hidden>
            {CAST.map((c, i) => (
              <li key={c.seed} className="rounded-full ring-4 ring-surface" style={{ zIndex: CAST.length - i }}>
                <PlayerAvatar nickname={c.seed} team={c.team} size={56} className="lg:size-[76px]!" />
              </li>
            ))}
          </ul>
          <p className="mt-5 font-display text-[2.25rem] leading-[2.25rem] font-bold text-ink uppercase lg:text-[3.5rem] lg:leading-[3.25rem]">
            Draft the pros.
            <br />
            <span className="text-accent">Follow every map.</span>
          </p>
          <ul className="mt-5 hidden space-y-2.5 lg:block">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-body text-ink-2">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-callout text-ink-2 lg:hidden">Free esports fantasy for CS2. Score from real maps, beat your friends.</p>
        </div>
      </aside>
      <main id="main" className="mx-auto w-full max-w-md px-5 pt-7 pb-16 lg:flex lg:flex-col lg:justify-center lg:py-10">
        {children}
      </main>
    </div>
  );
}
