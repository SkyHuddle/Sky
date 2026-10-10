import type { SVGProps } from "react";

/** A small, consistent stroke icon set (24px grid, 1.75 stroke). Decorative by default. */
const PATHS = {
  home: "M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z",
  roster: "M8 7a3 3 0 1 0 6 0 3 3 0 0 0-6 0M4 20c0-3.3 3.1-6 7-6s7 2.7 7 6M17.5 4.5a2.6 2.6 0 0 1 0 5M20.5 19.5c0-2.4-1.3-4.3-3.2-5.3",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20h7M10 17h4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 20.5c.8-3.6 3.9-6 7.5-6s6.7 2.4 7.5 6",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-3.5-3.5",
  chevronLeft: "M14.5 5.5 8 12l6.5 6.5",
  chevronRight: "M9.5 5.5 16 12l-6.5 6.5",
  chevronDown: "M5.5 9.5 12 16l6.5-6.5",
  x: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  star: "M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7.5V12l3 2",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 11v5.5M12 7.6v.4",
  alert: "M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.4v.4",
  share: "M12 3.5v12M7.5 8 12 3.5 16.5 8M5 13v6.5h14V13",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  refresh: "M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4",
  autopilot: "M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15.5l-1.8-4.9L5.5 9l4.7-1.4zM18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  swap: "M7 7h12M15 3l4 4-4 4M17 17H5M9 13l-4 4 4 4",
  calendar: "M4 6.5h16V20H4zM4 10.5h16M8.5 4v4M15.5 4v4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  logout: "M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6z",
  crown: "M4 8l4 4 4-7 4 7 4-4-1.5 10h-13zM5.5 20.5h13",
  map: "M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14",
  play: "M8 5.5v13l10.5-6.5z",
  filter: "M4 5.5h16l-6.2 7.3V19l-3.6-1.8v-4.4z",
  copy: "M8.5 8.5h11v11h-11zM15.5 8.5V4.5h-11v11h4",
  eye: "M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  wifiOff: "M2.5 8.5a14 14 0 0 1 5-2.8M21.5 8.5A14 14 0 0 0 11 4.6M5.5 12a9 9 0 0 1 3.4-2M18.5 12a9 9 0 0 0-2.6-1.7M9 15.5a4 4 0 0 1 5.5-.4M12 19h.01M3 3l18 18",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, strokeWidth = 1.75, title, ...rest }: { name: IconName; size?: number; strokeWidth?: number; title?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
