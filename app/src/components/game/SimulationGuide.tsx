import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { SIMULATION_GUIDE } from '@/engine/simulation-guide';

export function SimulationGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl glass-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm text-white/65">
          <Info className="w-4 h-4 text-gold/50 shrink-0" />
          {SIMULATION_GUIDE.headline}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/35 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3.5 border-t border-white/[0.05] pt-3.5">
          <p className="text-xs text-white/45 leading-relaxed">{SIMULATION_GUIDE.intro}</p>
          {SIMULATION_GUIDE.sections.map((s) => (
            <div key={s.title}>
              <p className="text-[10px] uppercase tracking-widest text-gold/65 font-medium">
                {s.title}
              </p>
              <p className="text-xs text-white/45 mt-1 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
