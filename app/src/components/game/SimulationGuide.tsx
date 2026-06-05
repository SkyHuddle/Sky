import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SIMULATION_GUIDE } from '@/engine/simulation-guide';

export function SimulationGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm text-white/70">{SIMULATION_GUIDE.headline}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
          <p className="text-xs text-white/45 leading-relaxed">{SIMULATION_GUIDE.intro}</p>
          {SIMULATION_GUIDE.sections.map((s) => (
            <div key={s.title}>
              <p className="text-[10px] uppercase tracking-widest text-gold/60">{s.title}</p>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
