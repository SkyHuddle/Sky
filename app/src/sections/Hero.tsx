import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Play, Circle } from 'lucide-react';
import { ESPORTS_URL } from '../config/esports';

const easeCustom: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface FloatingObj {
  id: string;
  name: string;
  tagline: string;
  image: string;
  style: React.CSSProperties;
  floatDelay: number;
  panelId: 'knowball' | 'bodyintel' | 'ringchase' | 'skyler';
}

const floatingObjects: FloatingObj[] = [
  {
    id: 'knowball',
    name: 'KnowBall',
    tagline: 'Sports trivia game',
    image: '/images/basketball.png',
    style: { top: '10%', right: '12%', width: 'clamp(140px, 18vw, 260px)', height: 'clamp(140px, 18vw, 260px)' },
    floatDelay: 0,
    panelId: 'knowball',
  },
  {
    id: 'bodyintel',
    name: 'BodyIntel',
    tagline: 'Fitness & nutrition tracker',
    image: '/images/dumbbell.png',
    style: { top: '18%', left: '10%', width: 'clamp(180px, 24vw, 360px)', height: 'clamp(90px, 12vw, 180px)' },
    floatDelay: 1.5,
    panelId: 'bodyintel',
  },
];

interface HeroProps {
  onOpenPanel: (panel: 'knowball' | 'bodyintel' | 'ringchase' | 'skyler') => void;
  onReplayIntro: () => void;
}

export default function Hero({ onOpenPanel, onReplayIntro }: HeroProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="relative h-screen p-3 md:p-4 overflow-hidden">
      <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden">
        {/* 4K Looping Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/images/hero-bg.mp4"
        />

        {/* Subtle depth gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 z-[1] pointer-events-none" />

        {/* Floating Basketball + Dumbbell */}
        {floatingObjects.map((obj) => (
          <motion.div
            key={obj.id}
            className="absolute z-[8] cursor-pointer"
            style={obj.style}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 1.5, -1.5, 0],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: obj.floatDelay,
            }}
            onMouseEnter={() => setHoveredId(obj.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onOpenPanel(obj.panelId)}
          >
            <AnimatePresence>
              {hoveredId === obj.id && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: 'radial-gradient(circle, rgba(222,219,200,0.15) 0%, transparent 70%)',
                    filter: 'blur(16px)',
                  }}
                />
              )}
            </AnimatePresence>

            <motion.img
              src={obj.image}
              alt={obj.name}
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))' }}
              animate={{ scale: hoveredId === obj.id ? 1.1 : 1 }}
              transition={{ duration: 0.3, ease: easeCustom }}
            />

            <AnimatePresence>
              {hoveredId === obj.id && (
                <motion.div
                  className="absolute z-[20] pointer-events-none"
                  style={
                    obj.id === 'knowball'
                      ? { top: '112%', left: '50%', transform: 'translateX(-50%)' }
                      : { bottom: '112%', left: '50%', transform: 'translateX(-50%)' }
                  }
                  initial={{ opacity: 0, y: obj.id === 'knowball' ? -6 : 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: obj.id === 'knowball' ? -4 : 4, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: easeCustom }}
                >
                  <div
                    className="whitespace-nowrap rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                    style={{
                      backgroundColor: 'rgba(10, 10, 10, 0.85)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(222, 219, 200, 0.1)',
                    }}
                  >
                    <div>
                      <span className="block text-xs font-semibold" style={{ color: '#E1E0CC' }}>{obj.name}</span>
                      <span className="block text-[10px] mt-0.5" style={{ color: 'rgba(225, 224, 204, 0.5)' }}>{obj.tagline}</span>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(222, 219, 200, 0.1)' }}>
                      <ArrowUpRight className="w-3 h-3" style={{ color: '#DEDBC8' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Skyler on Earth — floating container */}
        <motion.div
          className="absolute z-[6]"
          style={{
            bottom: '0%',
            left: '50%',
            x: '-50%',
            width: 'clamp(320px, 42vw, 560px)',
            height: 'clamp(440px, 58vw, 780px)',
          }}
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Character + Earth — sharp, no blur effects */}
          <AnimatePresence>
            {hoveredId === 'skyler' && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'radial-gradient(circle, rgba(222,219,200,0.15) 0%, transparent 70%)',
                  filter: 'blur(16px)',
                }}
              />
            )}
          </AnimatePresence>

          <motion.img
            src="/images/character.png"
            alt="Skyler on Earth"
            className="w-full h-full object-contain"
            style={{
              objectPosition: 'bottom center',
              filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))',
            }}
            animate={{ scale: hoveredId === 'skyler' ? 1.1 : 1 }}
            transition={{ duration: 0.3, ease: easeCustom }}
          />

          {/* Tight invisible hit box — positioned from BOTTOM where the character actually is */}
          <div
            className="absolute z-10 cursor-pointer"
            style={{
              bottom: '6%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40%',
              height: '32%',
            }}
            onClick={() => onOpenPanel('skyler')}
            onMouseEnter={() => setHoveredId('skyler')}
            onMouseLeave={() => setHoveredId(null)}
          />

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredId === 'skyler' && (
              <motion.div
                className="absolute z-[20] pointer-events-none"
                style={{ bottom: '42%', left: '50%', x: '-50%' }}
                initial={{ opacity: 0, y: 4, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 2, scale: 0.96 }}
                transition={{ duration: 0.2, ease: easeCustom }}
              >
                <div
                  className="whitespace-nowrap rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                  style={{
                    backgroundColor: 'rgba(10, 10, 10, 0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(222, 219, 200, 0.1)',
                  }}
                >
                  <div>
                    <span className="block text-xs font-semibold" style={{ color: '#E1E0CC' }}>Skyler Camper</span>
                    <span className="block text-[10px] mt-0.5" style={{ color: 'rgba(225, 224, 204, 0.5)' }}>Builder</span>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(222, 219, 200, 0.1)' }}>
                    <ArrowUpRight className="w-3 h-3" style={{ color: '#DEDBC8' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navbar */}
        <motion.nav
          className="absolute top-0 left-0 right-0 z-[10] flex items-center justify-between px-5 sm:px-8 md:px-10 py-4 sm:py-5"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: easeCustom }}
        >
          <a
            href="#"
            className="text-[10px] sm:text-xs font-bold tracking-[0.12em] uppercase"
            style={{ color: '#E1E0CC', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
          >
            Skyler Camper
          </a>

          <div className="flex items-center gap-4">
            <a
              href={ESPORTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-[10px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300"
              style={{ color: '#c9a227' }}
            >
              <Circle className="w-3 h-3 fill-[#c9a227]/30" />
              <span>Esports Games</span>
              <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
            <button
              onClick={onReplayIntro}
              className="group flex items-center gap-2 text-[10px] font-medium tracking-[0.06em] uppercase bg-transparent border-none cursor-pointer transition-colors duration-300"
              style={{ color: 'rgba(225, 224, 204, 0.5)' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#E1E0CC'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(225, 224, 204, 0.5)'; }}
            >
              <Play className="w-3 h-3" />
              <span>Replay intro</span>
            </button>
          </div>
        </motion.nav>

        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[12] w-[calc(100%-2.5rem)] max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: easeCustom }}
        >
          <a
            href={ESPORTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.82)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(201, 162, 39, 0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,162,39,0.08)',
            }}
          >
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] font-medium" style={{ color: 'rgba(201,162,39,0.8)' }}>
                Ring Chase · Golden Road
              </p>
              <p className="text-base font-bold tracking-wide mt-0.5" style={{ color: '#E1E0CC' }}>
                ESPORTS GAMES
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(225,224,204,0.45)' }}>
                CoD &amp; LoL draft games — separate site
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(201, 162, 39, 0.15)' }}
            >
              <ArrowUpRight className="w-4 h-4" style={{ color: '#c9a227' }} />
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
