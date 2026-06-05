import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

interface SisterBrandBarProps {
  subtitle?: string;
}

export function SisterBrandBar({ subtitle = 'CoD Esports · Sister to KnowBall' }: SisterBrandBarProps) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-3 pb-2 kb-brand-bar">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <Link
          to="/"
          className="text-[10px] font-bold uppercase tracking-[0.12em] text-kb-fg-soft hover:text-kb-fg transition-colors"
        >
          Skyler Camper
        </Link>
        <a
          href="https://knowball.us"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-kb-amber hover:text-kb-amber-hot transition-colors"
        >
          KnowBall
          <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
      <p className="max-w-lg mx-auto text-center text-[9px] uppercase tracking-[0.28em] text-kb-fg-faint mt-2">
        {subtitle}
      </p>
    </header>
  );
}
