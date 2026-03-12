import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  levelTitle: string;
  onNext: () => void;
  isLastLevel: boolean;
}

export default function SuccessAnimation({ show, levelTitle, onNext, isLastLevel }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-block mb-6"
            >
              <div className="w-24 h-24 rounded-full bg-terminal-green/20 flex items-center justify-center glow-green">
                <Trophy className="w-12 h-12 text-terminal-green" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              Mission Complete!
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground mb-8"
            >
              You cleared "{levelTitle}" successfully.
            </motion.p>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-shadow glow-red"
            >
              {isLastLevel ? 'You Win! Restart?' : 'Next Mission'}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: 0, y: 0, opacity: 1, scale: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 1.5, delay: 0.2 + Math.random() * 0.3 }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: '50%', top: '50%',
                background: i % 3 === 0 ? '#ee0000' : i % 3 === 1 ? '#55cc55' : '#e6a817',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
