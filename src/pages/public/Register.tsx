import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useAuth } from "../../context/AuthContext";

// ─── Apple-tuned constants ────────────────────────────────────────────────────
const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const;
const APPLE_SPRING = { stiffness: 380, damping: 38, mass: 1 };
const CARD_SPRING = { stiffness: 120, damping: 22, mass: 1 };

// ─── Shared variants ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94], delay },
  }),
};

// ─── FloatingCard ─────────────────────────────────────────────────────────────
const FloatingCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, CARD_SPRING);
  const y = useSpring(rawY, CARD_SPRING);

  useEffect(() => {
    let raf: number;
    let lx = 0,
      ly = 0;
    const onMove = (e: PointerEvent) => {
      lx = ((e.clientX - window.innerWidth / 2) / 90) * 1.5;
      ly = ((e.clientY - window.innerHeight / 2) / 90) * 1.5;
    };
    const tick = () => {
      rawX.set(lx);
      rawY.set(ly);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [rawX, rawY]);

  return (
    <motion.div
      style={{ x, y, translateZ: 0 }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
};

// ─── InputField ───────────────────────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  delay?: number;
  children?: React.ReactNode;
}
const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  required,
  delay = 0,
  children,
}) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    custom={delay}
    className="space-y-1"
  >
    <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider [-webkit-font-smoothing:antialiased]">
      {label}
    </label>
    <div className="relative group/input">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl
                   py-3 px-4 text-white placeholder:text-white/20
                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40
                   transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
      />
      {children}
    </div>
  </motion.div>
);

// ─── RegisteringOverlay ───────────────────────────────────────────────────────
// Full-screen loading screen shown while the registration API call is in-flight.
// Matches LoadingScreen's GPU-compositor techniques (scaleX bar, linear rings).
const RegisteringOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
  const rawProg = useMotionValue(0);
  const springProg = useSpring(rawProg, {
    stiffness: 60,
    damping: 22,
    mass: 1,
  });
  const barScaleX = useTransform(springProg, [0, 100], [0, 1]);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!visible) {
      rawProg.set(0);
      setPct(0);
      return;
    }
    // Stepped progress matching backend phases:
    // validate → create user → upload profile pic → session issue
    const steps: [number, number][] = [
      [20, 150],
      [42, 240],
      [61, 200],
      [76, 320],
      [88, 500],
    ];
    let i = 0;
    const tids: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      if (i >= steps.length) return;
      const [val, delay] = steps[i++];
      tids.push(
        setTimeout(() => {
          rawProg.set(val);
          setPct(val);
          run();
        }, delay),
      );
    };
    run();
    return () => tids.forEach(clearTimeout);
  }, [visible, rawProg]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="registering-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            transition: { duration: 0.5, ease: APPLE_EASE },
          }}
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
              className="w-[280px] h-[280px] rounded-full border border-primary/10 will-change-transform"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            />
            <motion.div
              className="absolute w-[210px] h-[210px] rounded-full border border-primary/[0.07] will-change-transform"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            />
            {/* Orbiting dot */}
            <motion.div
              className="absolute w-[280px] h-[280px] will-change-transform"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                              w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(175,37,244,1)]"
              />
            </motion.div>
          </div>

          {/* Center content */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: APPLE_EASE, delay: 0.08 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
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

            {/* Labels */}
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-2xl font-bold tracking-[0.4em] text-white uppercase [-webkit-font-smoothing:antialiased]">
                CLUB<span className="text-primary">369</span>
              </h1>
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <p className="text-[10px] font-bold tracking-[0.35em] text-gray-500 uppercase mt-1 [-webkit-font-smoothing:antialiased]">
                Creating your account…
              </p>
              <div className="flex gap-1.5 mt-2">
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
            </div>

            {/* Progress bar */}
            <div className="w-[200px] flex flex-col items-center gap-2">
              <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  style={{ scaleX: barScaleX, originX: 0, translateZ: 0 }}
                  className="h-full w-full bg-gradient-to-r from-primary via-purple-400 to-primary
                             will-change-transform shadow-[0_0_8px_rgba(175,37,244,0.8)]"
                />
              </div>
              <span className="text-[10px] font-bold text-primary/70 tracking-widest tabular-nums [-webkit-font-smoothing:antialiased]">
                {pct.toString().padStart(2, "0")}%
              </span>
            </div>
          </motion.div>

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

// ─── SuccessModal ─────────────────────────────────────────────────────────────
// Springs in from y:32 (no scale on the panel = no Metal re-rasterize).
// The check badge uses a spring-pop scale entrance, then a continuous
// opacity-only ring pulse (safe compositor property).
const SuccessModal: React.FC<{
  visible: boolean;
  userName: string;
  onContinue: () => void;
}> = ({ visible, userName, onContinue }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="success-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: APPLE_EASE }}
        className="fixed inset-0 z-[9998] flex items-center justify-center px-6
                   bg-black/70 backdrop-blur-md"
        style={{ willChange: "opacity" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.38, ease: APPLE_EASE, delay: 0.06 }}
          className="relative w-full max-w-sm bg-[#161118] border border-white/10
                     rounded-3xl p-8 shadow-2xl overflow-hidden text-center will-change-transform"
          style={{ translateZ: 0 } as React.CSSProperties}
        >
          {/* Glows */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[260px] h-[160px]
                          bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"
            style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
          />
          <div
            className="absolute bottom-0 right-0 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none"
            style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
          />

          {/* Success badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 28,
              delay: 0.18,
            }}
            className="relative z-10 mx-auto mb-6 w-20 h-20 rounded-full
                       bg-emerald-500/15 border border-emerald-500/30
                       flex items-center justify-center will-change-transform"
            style={{ translateZ: 0 } as React.CSSProperties}
          >
            {/* Pulse ring — opacity + scale, acceptable on one-time entry element */}
            <motion.div
              className="absolute inset-0 rounded-full border border-emerald-500/25 will-change-transform"
              animate={{ opacity: [0.8, 0], scale: [1, 1.6] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
              style={{ translateZ: 0 } as React.CSSProperties}
            />
            <motion.span
              className="material-symbols-outlined text-4xl text-emerald-400"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: APPLE_EASE, delay: 0.32 }}
            >
              check_circle
            </motion.span>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: APPLE_EASE, delay: 0.28 }}
            className="relative z-10 space-y-2 mb-8"
          >
            <h2 className="text-2xl font-bold text-white tracking-tight [-webkit-font-smoothing:antialiased]">
              Welcome aboard!
            </h2>
            <p className="text-sm text-gray-400 [-webkit-font-smoothing:antialiased]">
              Account created for{" "}
              <span className="text-primary font-bold">
                {userName || "you"}
              </span>
              .
            </p>
            <p className="text-xs text-gray-500 [-webkit-font-smoothing:antialiased]">
              Complete your membership by proceeding to payment.
            </p>
          </motion.div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          {/* CTA button */}
          <motion.button
            onClick={onContinue}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: APPLE_EASE, delay: 0.38 }}
            whileHover={{ scale: 1.025, y: -2 }}
            whileTap={{ scale: 0.975 }}
            className="relative z-10 w-full bg-white text-black hover:bg-primary hover:text-white
                       font-bold tracking-widest uppercase rounded-xl py-4
                       transition-colors duration-200
                       shadow-lg hover:shadow-[0_0_40px_rgba(175,37,244,0.4)]
                       flex items-center justify-center gap-2
                       will-change-transform [-webkit-font-smoothing:antialiased]"
            style={{ translateZ: 0 } as React.CSSProperties}
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
            Proceed to Payment
          </motion.button>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary/15 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary/15 rounded-br-3xl" />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Register ─────────────────────────────────────────────────────────────────
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUrl = "/images/cloud369.png";

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setRegistering(true);

      try {
        await register({ ...formData, profilePicture: profilePic });

        // Let progress bar visually settle at ~88% then snap to 100%
        await new Promise((r) => setTimeout(r, 260));
        setRegistering(false);

        // Brief gap for overlay exit animation, then show success modal
        await new Promise((r) => setTimeout(r, 220));
        setShowSuccess(true);
      } catch {
        setRegistering(false);
        setError("Registration failed. Please try again.");
      }
    },
    [formData, profilePic, register],
  );

  const handleContinue = useCallback(() => {
    setShowSuccess(false);
    navigate("/payment");
  }, [navigate]);

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center
                    justify-center font-display selection:bg-primary selection:text-white py-12"
    >
      {/* Background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[500px] h-[500px] bg-primary/8 rounded-full blur-[130px]"
          style={{ transform: "translateZ(0) translate(-50%, -50%)" }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-purple-900/8 rounded-full blur-[100px]"
          style={{ transform: "translateZ(0)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[320px] h-[320px] bg-blue-900/6 rounded-full blur-[90px]"
          style={{ transform: "translateZ(0)" }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg px-6">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <FloatingCard>
            <div
              className="bg-[#161118]/80 backdrop-blur-xl border border-white/10
                            rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden
                            hover:border-white/20 transition-colors duration-300"
            >
              <div
                className="absolute top-0 right-0 w-48 h-48 bg-primary/6 rounded-full blur-3xl pointer-events-none"
                style={{ transform: "translateZ(0)" }}
              />
              <div
                className="absolute bottom-0 left-0 w-48 h-48 bg-purple-900/6 rounded-full blur-3xl pointer-events-none"
                style={{ transform: "translateZ(0)" }}
              />

              {/* Header */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-center mb-8 flex flex-col items-center relative z-10"
              >
                <motion.div
                  className="mb-4 drop-shadow-[0_0_10px_rgba(175,37,244,0.4)] will-change-transform"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", ...APPLE_SPRING, delay: 0.05 }}
                  style={{ translateZ: 0 }}
                >
                  <img
                    src={logoUrl}
                    alt="CLUB369 Logo"
                    className="h-16 w-auto"
                  />
                </motion.div>
                <h1 className="text-2xl font-bold tracking-[0.2em] text-white mb-2 [-webkit-font-smoothing:antialiased]">
                  JOIN CLUB369
                </h1>
                <p className="text-gray-500 text-xs uppercase tracking-widest [-webkit-font-smoothing:antialiased]">
                  Begin your learning journey
                </p>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: APPLE_EASE }}
                      className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20
                                 rounded-lg text-red-500 text-[10px] font-bold uppercase tracking-widest
                                 [-webkit-font-smoothing:antialiased]"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Avatar upload */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="flex justify-center mb-8 relative z-10"
              >
                <motion.div
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={APPLE_SPRING}
                  className="relative cursor-pointer will-change-transform"
                  style={{ translateZ: 0 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    className="w-24 h-24 rounded-full border-2 border-dashed border-white/20
                                  flex items-center justify-center overflow-hidden bg-white/5
                                  hover:border-primary/50 transition-colors duration-200"
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-white/20">
                        add_a_photo
                      </span>
                    )}
                  </div>
                  <motion.div
                    className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg will-change-transform"
                    whileHover={{ scale: 1.15 }}
                    transition={APPLE_SPRING}
                    style={{ translateZ: 0 }}
                  >
                    <span className="material-symbols-outlined text-white text-xs">
                      edit
                    </span>
                  </motion.div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </motion.div>
              </motion.div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 relative z-10"
              >
                {/* Name + Email */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.15}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider [-webkit-font-smoothing:antialiased]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl
                                 py-3 px-4 text-white placeholder:text-white/20
                                 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40
                                 transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider [-webkit-font-smoothing:antialiased]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl
                                 py-3 px-4 text-white placeholder:text-white/20
                                 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40
                                 transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                    />
                  </div>
                </motion.div>

                <InputField
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 99999 99999"
                  required
                  delay={0.2}
                />

                {/* Password */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.25}
                  className="space-y-1"
                >
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider [-webkit-font-smoothing:antialiased]">
                    Create Password
                  </label>
                  <div className="relative group/input">
                    <span
                      className="material-symbols-outlined absolute left-4 inset-y-0 my-auto h-fit
                                     flex items-center text-white/40 group-focus-within/input:text-primary
                                     transition-colors duration-200 text-[20px] pointer-events-none"
                    >
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl
                                 py-3.5 pl-12 pr-12 text-white placeholder:text-white/20
                                 focus:border-primary focus:ring-1 focus:ring-primary/40 focus:outline-none
                                 transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      transition={APPLE_SPRING}
                      className="absolute right-4 inset-y-0 my-auto h-fit flex items-center
                                 text-white/40 hover:text-white transition-colors duration-200
                                 focus:outline-none will-change-transform"
                      style={{ translateZ: 0 }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>

                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.28}
                  className="text-xs text-gray-500 [-webkit-font-smoothing:antialiased]"
                >
                  Please upload your profile picture to complete registration
                  without errors.
                </motion.p>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={authLoading || registering}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.3}
                  whileHover={{ scale: 1.025, y: -2 }}
                  whileTap={{ scale: 0.975 }}
                  transition={APPLE_SPRING}
                  className="mt-2 w-full bg-white text-black hover:bg-primary hover:text-white
                             font-bold tracking-widest uppercase rounded-xl py-4
                             transition-colors duration-200 shadow-lg
                             flex items-center justify-center gap-2
                             hover:shadow-[0_0_40px_rgba(175,37,244,0.45)]
                             disabled:opacity-60 disabled:cursor-not-allowed
                             will-change-transform [-webkit-font-smoothing:antialiased]"
                  style={{ translateZ: 0 }}
                >
                  {authLoading || registering ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="material-symbols-outlined text-[18px] will-change-transform"
                        style={{ translateZ: 0 }}
                      >
                        progress_activity
                      </motion.span>
                      Creating Account…
                    </>
                  ) : (
                    "Enrol Now"
                  )}
                </motion.button>
              </form>

              {/* Footer */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.35}
                className="mt-8 text-center flex flex-col gap-3 relative z-10"
              >
                <Link
                  to="/login"
                  className="text-xs text-gray-500 hover:text-white transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                >
                  Already a member?{" "}
                  <span className="text-primary font-bold">Sign In</span>
                </Link>
                <Link
                  to="/"
                  className="text-[10px] text-gray-600 hover:text-white transition-colors duration-200 uppercase tracking-widest [-webkit-font-smoothing:antialiased]"
                >
                  Back to Home
                </Link>
              </motion.div>
            </div>
          </FloatingCard>
        </motion.div>
      </div>

      {/* Registration loading overlay — covers the API call */}
      <RegisteringOverlay visible={registering} />

      {/* Success modal — shown after overlay exits */}
      <SuccessModal
        visible={showSuccess}
        userName={formData.name}
        onContinue={handleContinue}
      />
    </div>
  );
};

export default Register;