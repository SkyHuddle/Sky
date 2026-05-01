import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Zap, Trophy, Dumbbell, Mail, Sparkles, Target } from 'lucide-react';
import Hero from './sections/Hero';
import Intro from './components/Intro';

type PanelType = 'knowball' | 'bodyintel' | 'skyler' | null;

const easeCustom: [number, number, number, number] = [0.16, 1, 0.3, 1];

const panels = {
  knowball: {
    title: 'KnowBall',
    tagline: 'Sports Trivia Game',
    status: 'In Development',
    accent: '#FF6B35',
    image: '/images/knowball.jpg',
    description:
      'An addictive sports trivia game built for any age. Test your knowledge, challenge friends, and compete to see who really knows the game.',
    bullets: [
      { text: 'Trivia across every major sport', icon: Trophy },
      { text: 'Head-to-head multiplayer challenges', icon: Target },
      { text: 'Leaderboards and streak tracking', icon: Zap },
      { text: 'Daily questions to keep you sharp', icon: Sparkles },
    ],
    link: '#',
    cta: 'Get early access',
  },
  bodyintel: {
    title: 'BodyIntel',
    tagline: 'Fitness & Nutrition Tracker',
    status: 'In Development',
    accent: '#4ADE80',
    image: '/images/bodyintel.jpg',
    description:
      'The all-in-one app to track food, workouts, supplements, water intake, and everything that goes into building a healthier you.',
    bullets: [
      { text: 'Log meals, macros, and calories', icon: Zap },
      { text: 'Track workouts, sets, and progress', icon: Target },
      { text: 'Monitor supplements and water intake', icon: Dumbbell },
      { text: 'See trends and hit your goals', icon: Trophy },
    ],
    link: '#',
    cta: 'Join the waitlist',
  },
  skyler: {
    title: 'Skyler Camper',
    tagline: 'Builder',
    status: '',
    accent: '#DEDBC8',
    image: '/images/character.png',
    description:
      'I like to build things. When I am not working, I am listening to music, watching sports, learning about history, hanging out with family, and continuing to build my relationship with God.',
    bullets: [
      { text: 'Founded Betmap.co — see where betting is legal and find the best promos', icon: Target },
      { text: 'Building BodyIntel — track food, workouts, supplements, and water', icon: Dumbbell },
      { text: 'Creating KnowBall — an addictive sports trivia game for any age', icon: Trophy },
      { text: 'Always learning, always building', icon: Sparkles },
    ],
    link: 'mailto:hello@skylercamper.com',
    cta: 'Say hello',
  },
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setActivePanel(null);
    setShowIntro(true);
  }, []);

  const panel = activePanel ? panels[activePanel] : null;

  return (
    <main className="bg-black min-h-screen">
      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && <Intro onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Interactive hero — always rendered behind intro */}
      <Hero onOpenPanel={setActivePanel} onReplayIntro={handleReplayIntro} />

      {/* Info Panel */}
      <AnimatePresence>
        {activePanel && panel && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={() => setActivePanel(null)}
            />

            {/* Panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-[51] w-full sm:w-[440px] md:w-[480px] overflow-hidden flex flex-col"
              style={{
                background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.5, ease: easeCustom }}
            >
              {/* Close button */}
              <div className="absolute top-4 left-4 z-20">
                <button
                  onClick={() => setActivePanel(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Hero Image */}
                <div
                  className="relative overflow-hidden flex items-end justify-center"
                  style={{
                    height: activePanel === 'skyler' ? '380px' : '260px',
                    background: activePanel === 'skyler'
                      ? 'linear-gradient(180deg, #1a1a2e 0%, #0f0f0f 100%)'
                      : undefined,
                  }}
                >
                  <img
                    src={panel.image}
                    alt={panel.title}
                    className="w-full h-full"
                    style={{
                      objectFit: activePanel === 'skyler' ? 'cover' : 'cover',
                      objectPosition: activePanel === 'skyler' ? 'center top' : 'center',
                      transform: activePanel === 'skyler' ? 'scale(1.4)' : undefined,
                      transformOrigin: activePanel === 'skyler' ? 'center top' : undefined,
                      filter: activePanel === 'skyler'
                        ? 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))'
                        : undefined,
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(to bottom, transparent 50%, #0a0a0a 100%)`,
                    }}
                  />

                  {panel.status && (
                    <motion.span
                      className="absolute top-4 right-4 text-[10px] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: `${panel.accent}20`,
                        color: panel.accent,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${panel.accent}30`,
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {panel.status}
                    </motion.span>
                  )}
                </div>

                {/* Content */}
                <div className="px-6 sm:px-8 pb-10 -mt-2 relative">
                  <motion.h2
                    className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] mb-1"
                    style={{ color: '#E1E0CC' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: easeCustom }}
                  >
                    {panel.title}
                  </motion.h2>

                  <motion.p
                    className="text-sm font-medium mb-6"
                    style={{ color: panel.accent }}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: easeCustom }}
                  >
                    {panel.tagline}
                  </motion.p>

                  <motion.div
                    className="rounded-2xl p-5 mb-8"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5, ease: easeCustom }}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'rgba(225, 224, 204, 0.65)' }}
                    >
                      {panel.description}
                    </p>
                  </motion.div>

                  <motion.ul
                    className="flex flex-col gap-4 mb-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                  >
                    {panel.bullets.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.li
                          key={i}
                          className="flex items-start gap-3.5"
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: easeCustom }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${panel.accent}15` }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: panel.accent }} />
                          </div>
                          <span
                            className="text-sm leading-relaxed pt-1"
                            style={{ color: 'rgba(225, 224, 204, 0.6)' }}
                          >
                            {item.text}
                          </span>
                        </motion.li>
                      );
                    })}
                  </motion.ul>

                  <motion.a
                    href={panel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 font-medium text-sm rounded-full pl-6 pr-2 py-2 transition-all duration-300 hover:gap-4"
                    style={{
                      backgroundColor: panel.accent,
                      color: '#0a0a0a',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: easeCustom }}
                  >
                    <span>{panel.cta}</span>
                    <span
                      className="rounded-full w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
                    >
                      {activePanel === 'skyler' ? (
                        <Mail className="w-3.5 h-3.5 text-black" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-black" />
                      )}
                    </span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
