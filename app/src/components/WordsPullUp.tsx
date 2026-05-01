import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
}

export default function WordsPullUp({ text, className = '', showAsterisk = false }: WordsPullUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const words = text.split(' ');

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => {
        const isLastWord = i === words.length - 1;
        return (
          <span key={i} className="inline-flex items-start overflow-visible">
            <motion.span
              className="inline-block"
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
              {i < words.length - 1 && <span>&nbsp;</span>}
              {isLastWord && showAsterisk && (
                <sup
                  className="relative inline-block"
                  style={{
                    top: '0.65em',
                    right: '-0.3em',
                    fontSize: '0.31em',
                    lineHeight: 1,
                  }}
                >
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: (i + 1) * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    *
                  </motion.span>
                </sup>
              )}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
