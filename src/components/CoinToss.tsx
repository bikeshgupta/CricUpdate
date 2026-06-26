import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * 3D coin flip. When `flipKey` changes it spins and lands on `outcome`,
 * then calls `onRest`. Single lime accent, no image assets.
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
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const spins = 3;
    const final = outcome === 'heads' ? 0 : 180;
    controls
      .start({
        rotateX: [0, spins * 360 + final],
        transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
      })
      .then(() => onRest?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipKey]);

  const face =
    'absolute inset-0 flex items-center justify-center rounded-full backface-hidden';

  return (
    <div className="flex items-center justify-center py-4" style={{ perspective: 1000 }}>
      <motion.div
        animate={controls}
        className="relative h-36 w-36"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Heads */}
        <div
          className={`${face} border-2 border-accent bg-surface`}
          style={{ transform: 'rotateX(0deg)' }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">H</div>
            <div className="mt-1 text-caption text-fg-muted">Heads</div>
          </div>
        </div>
        {/* Tails */}
        <div
          className={`${face} border-2 border-line-strong bg-surface`}
          style={{ transform: 'rotateX(180deg)' }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-fg">T</div>
            <div className="mt-1 text-caption text-fg-muted">Tails</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
