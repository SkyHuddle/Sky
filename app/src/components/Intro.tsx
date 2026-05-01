import { useState } from 'react';
import { motion } from 'framer-motion';

interface IntroProps {
  onComplete: () => void;
}

export default function Intro({ onComplete }: IntroProps) {
  const [fading, setFading] = useState(false);

  const handleEnter = () => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 4K Video — loops forever */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-contain sm:object-cover"
        src="/images/intro.mov"
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.35)' }}
      />

      {/* Enter button — only way to proceed */}
      <motion.button
        onClick={handleEnter}
        className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2 z-10 text-[10px] sm:text-xs font-medium tracking-[0.15em] uppercase px-7 py-3 rounded-full cursor-pointer transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: 'rgba(222, 219, 200, 0.08)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(222, 219, 200, 0.12)',
          color: '#DEDBC8',
        }}
        whileHover={{
          backgroundColor: 'rgba(222, 219, 200, 0.18)',
          borderColor: 'rgba(222, 219, 200, 0.28)',
        }}
      >
        Enter
      </motion.button>

      {/* Name top */}
      <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-10">
        <span
          className="text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase"
          style={{
            color: 'rgba(225, 224, 204, 0.45)',
            textShadow: '0 1px 10px rgba(0,0,0,0.6)',
          }}
        >
          Skyler Camper
        </span>
      </div>
    </motion.div>
  );
}
