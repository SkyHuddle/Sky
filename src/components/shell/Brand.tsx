import Link from "next/link";
import { cn } from "@/lib/cn";

/** Temporary original identity: "lockin". The mark is a roster bracket closing around a point. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--color-accent)" />
      <path d="M10.5 9v14h11" fill="none" stroke="#04241f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20.5" cy="13" r="3" fill="#04241f" />
    </svg>
  );
}

export function Brand({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-lg", className)} aria-label="Lockin home">
      <BrandMark />
      <span className="text-[1.0625rem] font-bold tracking-[-0.03em] text-ink">lockin</span>
    </Link>
  );
}
