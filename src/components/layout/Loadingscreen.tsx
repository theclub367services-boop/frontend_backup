import React, { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

// ─── Apple-tuned constants ────────────────────────────────────────────────────
const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const;
const APPLE_SPRING = { stiffness: 320, damping: 32, mass: 1 } as const;

export interface LoadingScreenProps {
  isLoading: boolean;
  /**
   * Sub-label beneath CLUB369.
   * Defaults to "Exclusive Learning Membership" (boot copy).
   * Set to e.g. "Signing In" or "Creating your account…" for action overlays.
   */
  label?: string;
  /**
   * Fade in from transparent instead of starting fully opaque.
   * Use true for mid-session action overlays; false (default) for boot screen.
   */
  fadeIn?: boolean;
  /**
   * Show the three bouncing dots beneath the label.
   * Useful for action overlays to communicate ongoing work.
   */
  showDots?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  label,
  fadeIn = false,
  showDots = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "done">("loading");

  const rawProgress = useMotionValue(0);
  const springProgress = useSpring(rawProgress, {
    stiffness: 60,
    damping: 22,
    mass: 1,
  });
  const barScaleX = useTransform(springProgress, [0, 100], [0, 1]);

  useEffect(() => {
    if (!isLoading) {
      rawProgress.set(100);
      setProgress(100);
      const t = setTimeout(() => setPhase("done"), 520);
      return () => clearTimeout(t);
    }

    // Re-show when reused as an action overlay
    setPhase("loading");
    rawProgress.set(0);
    setProgress(0);

    const steps: [number, number][] = [
      [18, 120],
      [35, 280],
      [52, 180],
      [68, 350],
      [79, 220],
      [85, 500],
      [90, 1200],
    ];

    let i = 0;
    let tid: ReturnType<typeof setTimeout>;
    const run = () => {
      if (i >= steps.length) return;
      const [val, delay] = steps[i++];
      tid = setTimeout(() => {
        setProgress(val);
        rawProgress.set(val);
        run();
      }, delay);
    };
    run();
    return () => clearTimeout(tid);
  }, [isLoading, rawProgress]);

  const displayLabel = label ?? "Exclusive Learning Membership";

  return (
    <AnimatePresence>
      {phase === "loading" && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: fadeIn ? 0 : 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            transition: { duration: 0.55, ease: APPLE_EASE },
          }}
          transition={fadeIn ? { duration: 0.22, ease: APPLE_EASE } : undefined}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center
                     bg-[#0a0008] overflow-hidden"
          style={{ willChange: "opacity, transform" }}
        >
          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px]"
              style={{
                transform: "translateZ(0) translate(-50%, -50%)",
                backfaceVisibility: "hidden",
              }}
            />
            <div
              className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-700/8 rounded-full blur-[100px]"
              style={{
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
              }}
            />
            <div
              className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-blue-900/6 rounded-full blur-[90px]"
              style={{
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
              }}
            />
          </div>

          {/* Rotating rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="w-[260px] h-[260px] rounded-full border border-primary/10 will-change-transform"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            />
            <motion.div
              className="absolute w-[200px] h-[200px] rounded-full border border-primary/[0.07] will-change-transform"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            />
            <motion.div
              className="absolute w-[260px] h-[260px] will-change-transform"
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                              w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(175,37,244,1)]"
              />
            </motion.div>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", ...APPLE_SPRING, delay: 0.1 }}
              className="relative will-change-transform"
              style={{ translateZ: 0 } as React.CSSProperties}
            >
              <div
                className="absolute inset-0 -m-6 bg-primary/20 rounded-full blur-[40px]"
                style={{
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }}
              />
              <img
                src="/images/cloud369.png"
                alt="CLUB369"
                className="h-24 w-auto relative z-10 drop-shadow-[0_0_20px_rgba(175,37,244,0.5)]"
                loading="eager"
                decoding="sync"
              />
            </motion.div>

            {/* Brand name + label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: APPLE_EASE, delay: 0.28 }}
              className="flex flex-col items-center gap-1"
            >
              <h1
                className="text-2xl font-bold tracking-[0.4em] text-white uppercase
                             [-webkit-font-smoothing:antialiased]"
              >
                CLUB<span className="text-primary">369</span>
              </h1>
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <p
                className="text-[10px] font-bold tracking-[0.35em] text-gray-500 uppercase mt-1
                            [-webkit-font-smoothing:antialiased]"
              >
                {displayLabel}
              </p>

              {showDots && (
                <div className="flex gap-1.5 mt-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 bg-primary rounded-full will-change-transform"
                      animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.18,
                      }}
                      style={{ translateZ: 0 } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Progress bar + counter */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.46, ease: APPLE_EASE, delay: 0.42 }}
              className="flex flex-col items-center gap-3 w-[200px]"
            >
              <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  style={{ scaleX: barScaleX, originX: 0, translateZ: 0 }}
                  className="h-full w-full bg-gradient-to-r from-primary via-purple-400 to-primary
                             will-change-transform shadow-[0_0_8px_rgba(175,37,244,0.8)]"
                />
              </div>
              <span
                className="text-[10px] font-bold text-primary/70 tracking-widest tabular-nums
                               [-webkit-font-smoothing:antialiased]"
              >
                {progress.toString().padStart(2, "0")}%
              </span>
            </motion.div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-primary/20 rounded-tl-2xl" />
          <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-primary/20 rounded-tr-2xl" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-primary/20 rounded-bl-2xl" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-primary/20 rounded-br-2xl" />

          {/* Watermark */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[18vw] font-bold
                          text-white/[0.018] pointer-events-none select-none leading-none"
          >
            369
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
