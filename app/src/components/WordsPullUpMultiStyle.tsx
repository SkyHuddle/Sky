import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
}

export default function WordsPullUpMultiStyle({ segments, className = '' }: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  let globalWordIndex = 0;

  return (
    <span ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {segments.map((segment, segIdx) => {
        const words = segment.text.split(' ');
        return words.map((word, wordIdx) => {
          const currentIndex = globalWordIndex++;
          return (
            <span key={`${segIdx}-${wordIdx}`} className="inline-flex overflow-hidden">
              <motion.span
                className={`inline-block ${segment.className || ''}`}
                initial={{ y: 20, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                transition={{
                  duration: 0.5,
                  delay: currentIndex * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
                <span>&nbsp;</span>
              </motion.span>
            </span>
          );
        });
      })}
    </span>
  );
}
