import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { AuthService } from "../../services/AuthService";

const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: APPLE_EASE, delay },
  }),
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Progress for login overlay bar
  const rawProg = useMotionValue(0);
  const springProg = useSpring(rawProg, {
    stiffness: 60,
    damping: 22,
    mass: 1,
  });
  const barScaleX = useTransform(springProg, [0, 100], [0, 1]);

  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouse = useRef({ x: 0, y: 0 });

  const onMouseMove = useCallback((e: MouseEvent) => {
    mouse.current = {
      x: (e.clientX - window.innerWidth / 2) / 80,
      y: (e.clientY - window.innerHeight / 2) / 80,
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      if (cardRef.current) {
        const { x, y } = mouse.current;
        cardRef.current.style.transform = `translate3d(${x * 1.5}px, ${y * 1.5}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [onMouseMove]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSigningIn(true);
    rawProg.set(0);

    // Stepped progress mimicking auth round-trip phases
    const steps: [number, number][] = [
      [25, 120],
      [50, 200],
      [72, 180],
      [88, 300],
    ];
    let i = 0;
    const tids: ReturnType<typeof setTimeout>[] = [];
    const runSteps = () => {
      if (i >= steps.length) return;
      const [val, delay] = steps[i++];
      tids.push(
        setTimeout(() => {
          rawProg.set(val);
          runSteps();
        }, delay),
      );
    };
    runSteps();

    try {
      await login(email, password);
      rawProg.set(100);
      // Let bar reach 100% before navigating
      await new Promise((r) => setTimeout(r, 420));
      const user = AuthService.getCurrentUser();
      if (user?.role?.toLowerCase() === "admin") {
        navigate("/admin");
      } else if (user?.status === "PENDING") {
        navigate("/payment");
      } else {
        navigate("/dashboard");
      }
    } catch {
      tids.forEach(clearTimeout);
      rawProg.set(0);
      setSigningIn(false);
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Reset email sent to:", resetEmail);
    setIsForgotModalOpen(false);
  };

  const logoUrl = "/images/cloud369.png";

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center font-display selection:bg-primary selection:text-white">
      {/* Static background blobs */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-purple-900/8 rounded-full blur-[100px]"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[320px] h-[320px] bg-blue-900/6 rounded-full blur-[90px]"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: APPLE_EASE }}
          style={{ willChange: "opacity, transform" }}
        >
          <div
            ref={cardRef}
            style={{
              transform: "translate3d(0, 0, 0)",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
            className="bg-[#161118]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            {/* Static inner corner glow */}
            <div
              className="absolute top-0 right-0 w-52 h-52 bg-primary/6 rounded-full blur-3xl pointer-events-none"
              style={{
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
              }}
            />
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/15 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/15 rounded-br-3xl" />

            {/* Header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-center mb-10 flex flex-col items-center relative z-10"
            >
              <div className="mb-6 drop-shadow-[0_0_10px_rgba(175,37,244,0.35)]">
                <img
                  src={logoUrl}
                  alt="CLUB369 Logo"
                  className="h-20 w-auto transition-transform duration-300 ease-out hover:scale-[1.04]"
                  style={{ willChange: "transform" }}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-[0.2em] text-white mb-2">
                CLUB369
              </h1>
              <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mt-3" />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: APPLE_EASE }}
                    className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-bold uppercase tracking-widest"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Form */}
            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-5 relative z-10"
            >
              {/* Email */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.08}
                className="space-y-1"
              >
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Email
                </label>
                <div className="relative group/input">
                  <span className="material-symbols-outlined absolute left-4 inset-y-0 my-auto h-fit flex items-center text-white/40 group-focus-within/input:text-primary transition-colors duration-200 text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white
                      focus:border-primary focus:outline-none
                      transition-colors duration-200"
                    required
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.14}
                className="space-y-1"
              >
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Password
                </label>
                <div className="relative group/input">
                  {/* Lock icon — same centering fix applied for consistency */}
                  <span className="material-symbols-outlined absolute left-4 inset-y-0 my-auto h-fit flex items-center text-white/40 group-focus-within/input:text-primary transition-colors duration-200 text-[20px] pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white
                      focus:border-primary focus:outline-none
                      transition-colors duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 inset-y-0 my-auto h-fit flex items-center
                               text-white/40 hover:text-white transition-colors duration-200
                               focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Forgot password — always visible */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[10px] font-bold text-primary/80 hover:text-primary uppercase tracking-tighter transition-colors duration-200"
                  >
                    Forgot Password?
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={authLoading}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.2}
                className="mt-2 w-full bg-white text-black hover:bg-primary hover:text-white font-bold tracking-widest uppercase rounded-xl py-4
                  transition-all duration-200 ease-out
                  hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0
                  shadow-lg flex items-center justify-center gap-2"
                style={{ willChange: "transform" }}
              >
                {authLoading && (
                  <motion.span
                    className="material-symbols-outlined text-lg"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ willChange: "transform" }}
                  >
                    progress_activity
                  </motion.span>
                )}
                {authLoading ? "Signing In..." : "Sign In"}
              </motion.button>
            </form>

            {/* Footer links */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.26}
              className="mt-8 text-center flex flex-col gap-4 relative z-10"
            >
              <Link
                to="/register"
                className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
              >
                Not a member?{" "}
                <span className="text-primary font-bold">Enrol Now</span>
              </Link>
              <Link
                to="/"
                className="text-xs text-gray-500 hover:text-white transition-colors duration-200"
              >
                Back to Home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: APPLE_EASE }}
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: APPLE_EASE }}
              style={{ willChange: "opacity, transform" }}
              className="relative w-full max-w-sm bg-[#1a151c] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-primary/8 rounded-full blur-3xl pointer-events-none"
                style={{
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }}
              />
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight relative z-10">
                Reset Password
              </h2>
              <p className="text-xs text-gray-400 mb-6 relative z-10">
                Enter your email and we'll send you instructions to reset your
                password.
              </p>
              <form
                onSubmit={handleResetPassword}
                className="space-y-4 relative z-10"
              >
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white
                    focus:border-primary focus:outline-none transition-colors duration-200"
                  required
                />
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest
                      transition-colors duration-200 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest
                      transition-all duration-200 ease-out
                      hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0
                      shadow-[0_0_15px_rgba(175,37,244,0.3)]"
                    style={{ willChange: "transform" }}
                  >
                    Send Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {signingIn && (
          <motion.div
            key="signin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: APPLE_EASE }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center
                       bg-[#0a0008]/95 backdrop-blur-md overflow-hidden"
            style={{ willChange: "opacity" }}
          >
            {/* Ambient glow */}
            <div
              className="absolute top-1/2 left-1/2 w-[500px] h-[500px]
                         bg-primary/12 rounded-full blur-[130px] pointer-events-none"
              style={{
                transform: "translateZ(0) translate(-50%, -50%)",
                backfaceVisibility: "hidden",
              }}
            />

            {/* Rotating rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-[220px] h-[220px] rounded-full border border-primary/12 will-change-transform"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ translateZ: 0 } as React.CSSProperties}
              />
              <motion.div
                className="absolute w-[160px] h-[160px] rounded-full border border-primary/8 will-change-transform"
                animate={{ rotate: -360 }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                style={{ translateZ: 0 } as React.CSSProperties}
              />
              {/* Orbiting dot */}
              <motion.div
                className="absolute w-[220px] h-[220px] will-change-transform"
                animate={{ rotate: 360 }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                style={{ translateZ: 0 } as React.CSSProperties}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                                w-2 h-2 bg-primary rounded-full
                                shadow-[0_0_10px_rgba(175,37,244,1)]"
                />
              </motion.div>
            </div>

            {/* Center content */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: APPLE_EASE, delay: 0.1 }}
              className="relative z-10 flex flex-col items-center gap-6"
            >
              {/* Logo */}
              <div className="relative">
                <div
                  className="absolute inset-0 -m-4 bg-primary/20 rounded-full blur-[30px]"
                  style={{
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                  }}
                />
                <img
                  src="/images/cloud369.png"
                  alt="CLUB369"
                  className="h-16 w-auto relative z-10
                             drop-shadow-[0_0_16px_rgba(175,37,244,0.55)]"
                  loading="eager"
                  decoding="sync"
                />
              </div>

              {/* Label */}
              <div className="flex flex-col items-center gap-1">
                <p
                  className="text-sm font-bold tracking-[0.3em] text-white uppercase
                               [-webkit-font-smoothing:antialiased]"
                >
                  Signing In
                </p>
                {/* Animated dots */}
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 bg-primary rounded-full will-change-transform"
                      animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
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
              </div>

              {/* Spring progress bar */}
              <div className="w-[180px] flex flex-col items-center gap-2">
                <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    style={{ scaleX: barScaleX, originX: 0, translateZ: 0 }}
                    className="h-full w-full bg-gradient-to-r from-primary via-purple-400 to-primary
                               will-change-transform shadow-[0_0_8px_rgba(175,37,244,0.8)]"
                  />
                </div>
              </div>
            </motion.div>

            {/* Corner accents */}
            <div className="absolute top-5 left-5 w-10 h-10 border-t-2 border-l-2 border-primary/20 rounded-tl-xl" />
            <div className="absolute top-5 right-5 w-10 h-10 border-t-2 border-r-2 border-primary/20 rounded-tr-xl" />
            <div className="absolute bottom-5 left-5 w-10 h-10 border-b-2 border-l-2 border-primary/20 rounded-bl-xl" />
            <div className="absolute bottom-5 right-5 w-10 h-10 border-b-2 border-r-2 border-primary/20 rounded-br-xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;