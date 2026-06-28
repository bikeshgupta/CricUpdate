import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * 3D coin flip with a toss-like arc (spin + rise/fall + slight wobble) and a
 * shrinking ground shadow that sells the height. Lands on `outcome`, then
 * calls `onRest`. Single accent colour, no image assets.
 */
export default function CoinToss({
  outcome,
  flipKey,
  onRest,
}: {
  outcome: 'heads' | 'tails';
  flipKey: number;
  onRest?: () => void;
}) {
  const controls = useAnimationControls();
  const shadowControls = useAnimationControls();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const spins = 5;
    const final = outcome === 'heads' ? 0 : 180;
    const duration = 1.3;
    controls
      .start({
        rotateX: [0, spins * 360 + final],
        y: [0, -130, 0],
        rotateZ: [0, 10, -8, 0],
        transition: {
          rotateX: { duration, ease: [0.33, 1, 0.68, 1] },
          y: { duration, times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] },
          rotateZ: { duration, ease: 'easeInOut' },
        },
      })
      .then(() => onRest?.());
    shadowControls.start({
      scaleX: [1, 0.45, 1],
      opacity: [0.35, 0.1, 0.35],
      transition: { duration, times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipKey]);

  const face = 'absolute inset-0 flex items-center justify-center rounded-full backface-hidden';

  return (
    <div className="flex flex-col items-center justify-center py-4" style={{ perspective: 1000 }}>
      <motion.div animate={controls} className="relative h-36 w-36" style={{ transformStyle: 'preserve-3d' }}>
        {/* Heads */}
        <div className={`${face} border-2 border-accent bg-surface shadow-lg`} style={{ transform: 'rotateX(0deg)' }}>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">H</div>
            <div className="mt-1 text-caption text-fg-muted">Heads</div>
          </div>
        </div>
        {/* Tails */}
        <div className={`${face} border-2 border-line-strong bg-surface shadow-lg`} style={{ transform: 'rotateX(180deg)' }}>
          <div className="text-center">
            <div className="text-3xl font-bold text-fg">T</div>
            <div className="mt-1 text-caption text-fg-muted">Tails</div>
          </div>
        </div>
      </motion.div>
      <motion.div animate={shadowControls} initial={{ opacity: 0.35 }} className="mt-4 h-3 w-24 rounded-full bg-black/50 blur-[3px]" />
    </div>
  );
}
