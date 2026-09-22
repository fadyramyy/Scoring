import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreAnimationBubble } from '../../types';

interface ScoreAnimationProps {
  bubbles: ScoreAnimationBubble[];
}

export const ScoreAnimationOverlay: React.FC<ScoreAnimationProps> = ({ bubbles }) => {
  return (
    <AnimatePresence>
      {bubbles.map((b) => {
        const isPositive = b.points > 0;
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -45, scale: 1.2 }}
            exit={{ opacity: 0, y: -70, scale: 0.8 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`pointer-events-none absolute top-2 right-4 z-30 font-extrabold text-lg sm:text-2xl px-3 py-1 rounded-full shadow-xl flex items-center gap-1 ${
              isPositive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30'
            }`}
          >
            {b.label}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};
