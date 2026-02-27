import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useMembership } from "../../hooks/useMembership";
import Profile from "../shared/Profile";
import RenewButton from "../../components/membership/RenewButton";
import VoucherCard from "../../components/vouchers/VoucherCard";
import { getFullUrl } from "../../utils/url";
import { formatDate } from "../../utils/date";

// ─── Apple-tuned constants ────────────────────────────────────────────────────
const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const;
const APPLE_SPRING = { stiffness: 380, damping: 38, mass: 1 } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: APPLE_EASE, delay },
  }),
};

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Overview", path: "/dashboard", icon: "grid_view" },
  { label: "Profile", path: "/dashboard/profile", icon: "account_circle" },
  {
    label: "Vouchers",
    path: "/dashboard/vouchers",
    icon: "confirmation_number",
  },
  { label: "Payments", path: "/dashboard/payments", icon: "payments" },
];

// ─── Vault items ──────────────────────────────────────────────────────────────
const VAULT_ITEMS = [
  {
    title: "Trading Signals",
    desc: "Real-time market insights",
    icon: "monitoring",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Business Strategy",
    desc: "Scale your ventures",
    icon: "business_center",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "Member Meetups",
    desc: "Global networking events",
    icon: "groups",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Alpha Library",
    desc: "Curated investment docs",
    icon: "menu_book",
    color: "bg-orange-500/10 text-orange-500",
  },
];

// ─── VaultCard — GPU-composited hover, zero layout triggers ──────────────────
const VaultCard: React.FC<{ item: (typeof VAULT_ITEMS)[0]; delay: number }> = ({
  item,
  delay,
}) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    custom={delay}
    whileHover={{ y: -5 }}
    transition={APPLE_SPRING}
    className="p-6 bg-[#161118] border border-white/5 rounded-2xl
               hover:border-primary/30 transition-colors duration-300
               will-change-transform"
    style={{ translateZ: 0 } as React.CSSProperties}
  >
    <span
      className={`material-symbols-outlined p-3 rounded-xl ${item.color} mb-4 block w-fit`}
    >
      {item.icon}
    </span>
    <h4 className="font-bold text-white mb-1 [-webkit-font-smoothing:antialiased]">
      {item.title}
    </h4>
    <p className="text-xs text-gray-500 [-webkit-font-smoothing:antialiased]">
      {item.desc}
    </p>
  </motion.div>
);

// ─── Progress bar — spring-driven width, single compositor pass ──────────────
const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
  const raw = useMotionValue(0);
  const smooth = useSpring(raw, { stiffness: 60, damping: 22, mass: 1 });

  useEffect(() => {
    raw.set(percent);
  }, [percent, raw]);

  return (
    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div
        style={{ scaleX: smooth, originX: 0, translateZ: 0 }}
        className="h-full w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500
                   will-change-transform"
      />
    </div>
  );
};

// ─── Overview ─────────────────────────────────────────────────────────────────
const Overview: React.FC<{
  user: any;
  details: any;
  transactions: any[];
  daysRemaining: number;
  progressPercent: number;
}> = ({ user, details, daysRemaining, progressPercent }) => (
  <div className="space-y-12">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Subscription card */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="lg:col-span-2 bg-gradient-to-br from-[#161118] to-[#0f0a12]
                   border border-white/10 p-8 rounded-3xl relative overflow-hidden
                   flex flex-col justify-between h-full group
                   hover:border-white/20 transition-colors duration-300"
      >
        {/* Corner glow — opacity only on hover */}
        <div
          className="absolute top-0 right-0 w-48 h-48 bg-primary/6 rounded-full blur-3xl
                     opacity-100 group-hover:opacity-[1.8] transition-opacity duration-500"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <div
              className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1
                            [-webkit-font-smoothing:antialiased]"
            >
              Status
            </div>
            <div className="flex items-center gap-3">
              <h4 className="text-2xl font-bold [-webkit-font-smoothing:antialiased]">
                Member Account
              </h4>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold border rounded-full uppercase
                               [-webkit-font-smoothing:antialiased]
                               ${
                                 details?.status === "ACTIVE"
                                   ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                   : "bg-red-500/10 text-red-500 border-red-500/20"
                               }`}
              >
                {details?.status || "INACTIVE"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1
                            [-webkit-font-smoothing:antialiased]"
            >
              Next Billing
            </div>
            <div className="text-xl font-bold [-webkit-font-smoothing:antialiased]">
              {details
                ? new Date(details.nextBillingDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )
                : "N/A"}
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
            <span className="text-gray-400 [-webkit-font-smoothing:antialiased]">
              Cycle Progress
            </span>
            <span className="text-primary [-webkit-font-smoothing:antialiased]">
              {daysRemaining} Days Left
            </span>
          </div>
          <div className="mb-6">
            <ProgressBar percent={progressPercent} />
          </div>
          <RenewButton
            status={details?.status || "none"}
            expiryDate={details?.expiryDate || ""}
            amount={4999}
            email={user?.email || ""}
            name={user?.name || ""}
            mobile={user?.mobile || ""}
          />
        </div>
      </motion.div>

      {/* Contact card */}
      <motion.a
        href="mailto:theclub369.services@gmail.com"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.1}
        whileHover={{ y: -4 }}
        transition={APPLE_SPRING}
        className="bg-[#161118] border border-white/10 p-8 rounded-3xl
                   flex flex-col items-center justify-center gap-6 group
                   hover:border-primary/30 transition-colors duration-300 cursor-pointer
                   will-change-transform"
        style={{ translateZ: 0 } as React.CSSProperties}
      >
        <motion.div
          whileHover={{ scale: 1.12 }}
          transition={APPLE_SPRING}
          className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center
                     will-change-transform"
          style={{ translateZ: 0 } as React.CSSProperties}
        >
          <span className="material-symbols-outlined text-primary text-3xl">
            mail
          </span>
        </motion.div>
        <div className="text-center">
          <h5
            className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1
                         [-webkit-font-smoothing:antialiased]"
          >
            Contact Admin
          </h5>
          <p className="text-lg font-bold text-white [-webkit-font-smoothing:antialiased]">
            theclub369.services@gmail.com
          </p>
        </div>
        <div
          className="text-[10px] uppercase font-bold text-primary tracking-[0.2em]
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        [-webkit-font-smoothing:antialiased]"
        >
          Click to Email
        </div>
      </motion.a>
    </div>

    {/* Vault */}
    <section>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.18}
        className="flex justify-between items-center mb-6"
      >
        <h3
          className="text-xl font-bold flex items-center gap-2 text-white
                       [-webkit-font-smoothing:antialiased]"
        >
          <span className="material-symbols-outlined text-primary">
            diamond
          </span>
          Ecosystem Vault
        </h3>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {VAULT_ITEMS.map((item, i) => (
          <VaultCard key={i} item={item} delay={0.24 + i * 0.06} />
        ))}
      </div>
    </section>
  </div>
);

// ─── Vouchers ─────────────────────────────────────────────────────────────────
interface VouchersProps {
  user: any;
  membershipStatus: string;
  vouchers: any[];
  onClaim: (id: string) => void;
}

const Vouchers: React.FC<VouchersProps> = ({
  membershipStatus,
  vouchers,
  onClaim,
}) => (
  <div className="space-y-8">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex justify-between items-end"
    >
      <div>
        <h2
          className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter
                       [-webkit-font-smoothing:antialiased]"
        >
          My Rewards
        </h2>
        <p className="text-gray-500 text-sm [-webkit-font-smoothing:antialiased]">
          Exclusive benefits curated for your membership tier.
        </p>
      </div>
    </motion.div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vouchers.map((v, i) => (
        <motion.div
          key={v.id}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={i * 0.06}
          className="will-change-transform"
          style={{ translateZ: 0 } as React.CSSProperties}
        >
          <VoucherCard
            {...v}
            membershipStatus={membershipStatus}
            onClaim={onClaim}
          />
        </motion.div>
      ))}
    </div>
  </div>
);

// ─── TransactionLedger ────────────────────────────────────────────────────────
const TransactionLedger: React.FC<{ transactions: any[] }> = ({
  transactions,
}) => (
  <div className="space-y-8">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-2"
    >
      <h3
        className="text-2xl font-bold text-white uppercase tracking-tight
                     [-webkit-font-smoothing:antialiased]"
      >
        Payment History
      </h3>
      <p className="text-gray-500 text-sm [-webkit-font-smoothing:antialiased]">
        Comprehensive record of your subscription payments.
      </p>
    </motion.div>

    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={0.08}
      className="bg-[#161118] border border-white/10 rounded-3xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-widest">
              {["Billing Date", "Reference", "Amount", "Status"].map((h, i) => (
                <th
                  key={i}
                  className={`p-5 [-webkit-font-smoothing:antialiased] ${i === 3 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map((txn, i) => (
              <motion.tr
                key={txn.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.06 + i * 0.04}
                className="border-t border-white/5 hover:bg-white/[0.025]
                           transition-colors duration-200 text-white"
              >
                <td className="p-5 text-gray-400 [-webkit-font-smoothing:antialiased]">
                  {formatDate(txn.date)}
                </td>
                <td className="p-5 font-mono text-xs [-webkit-font-smoothing:antialiased]">
                  {txn.id}
                </td>
                <td className="p-5 font-bold [-webkit-font-smoothing:antialiased]">
                  ₹ {txn.amount.toLocaleString()}
                </td>
                <td className="p-5 text-right">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase
                                   [-webkit-font-smoothing:antialiased]
                                   ${
                                     txn.status === "success"
                                       ? "bg-emerald-500/10 text-emerald-500"
                                       : "bg-red-500/10 text-red-500"
                                   }`}
                  >
                    {txn.status === "success" ? "PAID" : txn.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { details, vouchers, transactions, isLoading, claimVoucher } =
    useMembership();

  const handleLogout = useCallback(async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      navigate("/login");
    }
  }, [logout, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            className="flex items-center gap-3 text-white/50 font-bold tracking-widest uppercase text-xs
                       [-webkit-font-smoothing:antialiased]"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.span
              className="material-symbols-outlined will-change-transform"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            >
              progress_activity
            </motion.span>
            Initializing Dashboard…
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const today = new Date();
  const expiry = details ? new Date(details.expiryDate) : today;
  const daysRemaining = Math.max(
    0,
    Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const progressPercent = details
    ? Math.min(100, ((30 - daysRemaining) / 30) * 100)
    : 0;

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <motion.header
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: APPLE_EASE }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", ...APPLE_SPRING, delay: 0.08 }}
            className="w-12 h-12 rounded-full border-2 border-primary/20 overflow-hidden
                       bg-primary/10 flex items-center justify-center shrink-0
                       will-change-transform"
            style={{ translateZ: 0 } as React.CSSProperties}
          >
            {user?.profile_picture ? (
              <img
                src={getFullUrl(user.profile_picture) || ""}
                alt={user.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
            ) : (
              <span className="material-symbols-outlined text-2xl text-primary/40">
                person
              </span>
            )}
          </motion.div>

          <div className="space-y-1">
            <h2
              className="text-3xl font-black tracking-tight text-white
                           [-webkit-font-smoothing:antialiased]"
            >
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                {user?.name || "Member"}.
              </span>
            </h2>
            <p
              className="text-gray-400 text-sm flex items-center gap-2
                          [-webkit-font-smoothing:antialiased]"
            >
              {/* Pulse dot — single element, cheap */}
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                style={{ transform: "translateZ(0)" }}
              />
              Member ID: {user?.id ? String(user.id).slice(0, 8) : "N/A"}
            </p>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={APPLE_SPRING}
          className="px-6 py-2.5 bg-red-600/10 border border-red-600/20 text-red-500
                     text-xs font-bold uppercase tracking-widest rounded-xl
                     hover:bg-red-600 hover:text-white
                     transition-colors duration-200
                     flex items-center gap-2
                     will-change-transform
                     [-webkit-font-smoothing:antialiased]"
          style={{ translateZ: 0 } as React.CSSProperties}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </motion.button>
      </motion.header>

      {/* ── Sub-nav ── */}
      <nav className="flex gap-1 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        {NAV_ITEMS.map((item, i) => {
          const active = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: APPLE_EASE, delay: i * 0.05 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold
                            uppercase tracking-widest transition-colors duration-200
                            [-webkit-font-smoothing:antialiased]
                            ${
                              active
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/5"
                            }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Route views — y-only transitions, no scale ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24, ease: APPLE_EASE }}
          style={{ willChange: "opacity, transform" }}
        >
          <Routes location={location}>
            <Route
              index
              element={
                <Overview
                  user={user}
                  details={details}
                  transactions={transactions}
                  daysRemaining={daysRemaining}
                  progressPercent={progressPercent}
                />
              }
            />
            <Route path="profile" element={<Profile />} />
            <Route
              path="vouchers"
              element={
                <Vouchers
                  user={user}
                  membershipStatus={details?.status || "NONE"}
                  vouchers={vouchers}
                  onClaim={claimVoucher}
                />
              }
            />
            <Route
              path="payments"
              element={<TransactionLedger transactions={transactions} />}
            />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Dashboard;