import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Lightbulb } from 'lucide-react';

interface SenseiProps {
  hints: string[];
  hintIndex: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sensei({ hints, hintIndex, isOpen, onToggle }: SenseiProps) {
  const currentHint = hints[Math.min(hintIndex, hints.length - 1)] || 'You have mastered this level. No hints needed.';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-80 rounded-lg border border-sensei-border bg-sensei-bg p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-terminal-amber" />
                <span className="text-sm font-semibold text-terminal-amber">The Sensei</span>
              </div>
              <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-secondary-foreground leading-relaxed font-mono">
              {currentHint}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Hint {Math.min(hintIndex + 1, hints.length)} of {hints.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg glow-red transition-shadow"
      >
        <MessageCircle className="w-5 h-5 text-primary-foreground" />
      </motion.button>
    </div>
  );
}
