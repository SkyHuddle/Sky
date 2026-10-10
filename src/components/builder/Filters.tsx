"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { BuilderData } from "@/server/queries/contest";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { TeamMark } from "../ui/identity";
import { Sheet } from "../ui/Sheet";
import type { Filters, SortKey } from "./useBuilder";

/** Sorts backed by real data (DESIGN.md §5.3): salary, fantasy average, recent form. */
export const SORTS: { key: SortKey; label: string; short: string }[] = [
  { key: "price_desc", label: "Salary: high to low", short: "Salary" },
  { key: "price_asc", label: "Salary: low to high", short: "Salary ↑" },
  { key: "avg", label: "Fantasy average (per map)", short: "Fantasy avg" },
  { key: "form", label: "Recent form (last 3 maps)", short: "Form" },
];
export const ROLES = ["AWPer", "Entry", "Rifler", "Support", "IGL"];

export function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative block">
      <span className="sr-only">Search players or teams</span>
      <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search players or teams"
        className="h-11 w-full rounded-xl bg-surface pr-10 pl-10 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/60"
        autoComplete="off"
        enterKeyHint="search"
      />
      {value ? (
        <button onClick={() => onChange("")} aria-label="Clear search" className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 hover:bg-elevated hover:text-ink">
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </label>
  );
}

function Chip({ active, onClick, children, label }: { active?: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-footnote font-medium transition-colors",
        active ? "bg-ink text-bg" : "bg-surface text-ink-2 ring-1 ring-border ring-inset hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Mobile quick controls: All, Team, Sort, Fits budget. Roles are player metadata, not lineup slots,
 * so they live in the Filters sheet rather than as tabs (DESIGN.md §5.3).
 */
export function FilterChips({ data, filters, setFilters }: { data: BuilderData; filters: Filters; setFilters: (f: Filters) => void }) {
  const [sheet, setSheet] = useState<"teams" | "sort" | "more" | null>(null);
  const filtered = filters.teams.length > 0 || filters.roles.length > 0 || filters.affordable;
  const teamIds = [...new Set(data.pool.map((p) => p.teamId))].sort((a, b) => (data.teams[a]?.name ?? "").localeCompare(data.teams[b]?.name ?? ""));
  const sort = SORTS.find((s) => s.key === filters.sort)!;
  return (
    <>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        <Chip active={!filtered} onClick={() => setFilters({ ...filters, teams: [], roles: [], affordable: false })}>
          All
        </Chip>
        <Chip active={filters.teams.length > 0} onClick={() => setSheet("teams")}>
          {filters.teams.length ? `${filters.teams.length} team${filters.teams.length > 1 ? "s" : ""}` : "Team"}
          <Icon name="chevronDown" size={14} />
        </Chip>
        <Chip active={false} onClick={() => setSheet("sort")} label={`Sort: ${sort.label}`}>
          <Icon name="sliders" size={14} /> {sort.short}
        </Chip>
        <Chip active={filters.affordable} onClick={() => setFilters({ ...filters, affordable: !filters.affordable })}>
          Fits budget
        </Chip>
        <Chip active={filters.roles.length > 0} onClick={() => setSheet("more")}>
          {filters.roles.length ? `Role · ${filters.roles.length}` : "Role"}
          <Icon name="chevronDown" size={14} />
        </Chip>
      </div>

      <Sheet open={sheet === "more"} onOpenChange={(o) => !o && setSheet(null)} title="Filter by role" footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setFilters({ ...filters, roles: [] })}>
              Clear
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setSheet(null)}>
              Show players
            </Button>
          </div>
        }>
        <p className="mb-3 text-footnote text-ink-2">Roles describe how a player plays. Any five players make a valid lineup.</p>
        <div className="flex flex-wrap gap-2 pb-2">
          {ROLES.map((r) => (
            <Chip key={r} active={filters.roles.includes(r)} onClick={() => setFilters({ ...filters, roles: filters.roles.includes(r) ? filters.roles.filter((x) => x !== r) : [...filters.roles, r] })}>
              {r}
            </Chip>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={sheet === "teams"}
        onOpenChange={(o) => !o && setSheet(null)}
        title="Filter by team"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setFilters({ ...filters, teams: [] })}>
              Clear
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setSheet(null)}>
              Show players
            </Button>
          </div>
        }
      >
        <TeamList data={data} teamIds={teamIds} filters={filters} setFilters={setFilters} />
      </Sheet>

      <Sheet open={sheet === "sort"} onOpenChange={(o) => !o && setSheet(null)} title="Sort players">
        <ul className="space-y-1 pb-2">
          {SORTS.map((s) => (
            <li key={s.key}>
              <button
                onClick={() => {
                  setFilters({ ...filters, sort: s.key });
                  setSheet(null);
                }}
                className={cn("flex h-12 w-full items-center justify-between rounded-xl px-3 text-left text-[0.9375rem]", filters.sort === s.key ? "bg-elevated text-ink" : "text-ink-2 hover:bg-elevated")}
              >
                {s.label}
                {filters.sort === s.key ? <Icon name="check" size={18} className="text-accent" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

export function TeamList({ data, teamIds, filters, setFilters }: { data: BuilderData; teamIds: string[]; filters: Filters; setFilters: (f: Filters) => void }) {
  return (
    <ul className="grid grid-cols-1 gap-1 pb-2 sm:grid-cols-2 lg:grid-cols-1">
      {teamIds.map((id) => {
        const t = data.teams[id];
        const on = filters.teams.includes(id);
        return (
          <li key={id}>
            <button
              onClick={() => setFilters({ ...filters, teams: on ? filters.teams.filter((x) => x !== id) : [...filters.teams, id] })}
              aria-pressed={on}
              className={cn("flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-callout", on ? "bg-elevated text-ink" : "text-ink-2 hover:bg-elevated")}
            >
              <TeamMark team={t} size={26} />
              <span className="flex-1 truncate">{t?.name}</span>
              <span className={cn("inline-flex size-5 items-center justify-center rounded-md ring-1", on ? "bg-accent text-accent-ink ring-accent" : "ring-border-strong")}>
                {on ? <Icon name="check" size={13} strokeWidth={3} /> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop filter column. */
export function FilterPanel({ data, filters, setFilters }: { data: BuilderData; filters: Filters; setFilters: (f: Filters) => void }) {
  const teamIds = [...new Set(data.pool.map((p) => p.teamId))].sort((a, b) => (data.teams[a]?.name ?? "").localeCompare(data.teams[b]?.name ?? ""));
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-eyebrow text-ink-3">Sort</h3>
        <ul className="space-y-0.5">
          {SORTS.map((s) => (
            <li key={s.key}>
              <button onClick={() => setFilters({ ...filters, sort: s.key })} aria-pressed={filters.sort === s.key} className={cn("flex h-10 w-full items-center justify-between rounded-[10px] px-3 text-left text-callout", filters.sort === s.key ? "bg-elevated font-semibold text-ink" : "text-ink-2 hover:bg-surface")}>
                {s.label}
                {filters.sort === s.key ? <Icon name="check" size={15} className="text-accent" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-eyebrow text-ink-3">Role</h3>
        <p className="mb-2 text-caption text-ink-3">Metadata only. Any five players make a lineup.</p>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <Chip key={r} active={filters.roles.includes(r)} onClick={() => setFilters({ ...filters, roles: filters.roles.includes(r) ? filters.roles.filter((x) => x !== r) : [...filters.roles, r] })}>
              {r}
            </Chip>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-footnote text-ink-2">
          <input type="checkbox" checked={filters.affordable} onChange={() => setFilters({ ...filters, affordable: !filters.affordable })} className="size-4 accent-[var(--color-accent)]" />
          Only players that fit my budget
        </label>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-eyebrow text-ink-3">Teams</h3>
          {filters.teams.length ? (
            <button className="text-caption font-medium text-accent" onClick={() => setFilters({ ...filters, teams: [] })}>
              Clear
            </button>
          ) : null}
        </div>
        <TeamList data={data} teamIds={teamIds} filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
}
