import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Profile from "../shared/Profile";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { AdminService } from "../../services/AdminService";
import { User as Member } from "../../types/auth";
import { Transaction } from "../../types/membership";
import { getFullUrl } from "../../utils/url";
import { formatDate } from "../../utils/date";

// ─── Apple-tuned constants ────────────────────────────────────────────────────
const APPLE_EASE = [0.25, 0.1, 0.25, 1] as const;
const APPLE_SPRING = { stiffness: 380, damping: 38, mass: 1 } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: APPLE_EASE, delay },
  }),
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminVoucher {
  id: string;
  title: string;
  code: string;
  description: string;
  limitPerUser: number;
  expiryDate: string;
  isSuspended: boolean;
  usageCount: number;
  usedBy: string[];
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Overview", path: "/admin", icon: "dashboard" },
  { label: "Profile", path: "/admin/profile", icon: "account_circle" },
  { label: "Users", path: "/admin/users", icon: "group" },
  {
    label: "Transactions",
    path: "/admin/transactions",
    icon: "account_balance",
  },
  { label: "Vouchers", path: "/admin/vouchers", icon: "confirmation_number" },
];

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Extracted so whileHover spring + GPU layer are scoped per card
const StatCard: React.FC<{
  title: string;
  val: string;
  icon: string;
  color: string;
  delay: number;
}> = ({ title, val, icon, color, delay }) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    custom={delay}
    whileHover={{ y: -4 }}
    transition={APPLE_SPRING}
    className="bg-[#161118] border border-white/10 p-6 rounded-2xl relative overflow-hidden
               hover:border-white/20 transition-colors duration-300 group will-change-transform"
    style={{ translateZ: 0 } as React.CSSProperties}
  >
    <div
      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-60
                 group-hover:opacity-100 transition-opacity duration-500"
      style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
    />
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p
          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1
                      [-webkit-font-smoothing:antialiased]"
        >
          {title}
        </p>
        <h4 className="text-2xl font-bold text-white [-webkit-font-smoothing:antialiased]">
          {val}
        </h4>
      </div>
      <span className={`material-symbols-outlined ${color}`}>{icon}</span>
    </div>
  </motion.div>
);

// ─── MemberModal ──────────────────────────────────────────────────────────────
// Extracted to isolate AnimatePresence + hover-zoom state
const MemberModal: React.FC<{
  member: Member;
  onClose: () => void;
  onDelete: (id: string) => void;
}> = ({ member, onClose, onDelete }) => {
  const [ppHovered, setPpHovered] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: APPLE_EASE }}
      onClick={onClose}
    >
      {/* Modal panel — y-only entry, no scale (avoids Metal re-rasterize) */}
      <motion.div
        className="bg-[#161118] border border-white/10 rounded-2xl p-6 max-w-lg w-full
                   max-h-[90vh] overflow-y-auto will-change-transform"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.3, ease: APPLE_EASE }}
        style={{ translateZ: 0 } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar with hover-zoom */}
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden
                         bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer
                         will-change-transform"
              style={{ translateZ: 0 } as React.CSSProperties}
              whileHover={{ scale: 1.08 }}
              transition={APPLE_SPRING}
              onHoverStart={() => setPpHovered(true)}
              onHoverEnd={() => setPpHovered(false)}
            >
              {member.profile_picture ? (
                <img
                  src={getFullUrl(member.profile_picture) || ""}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <span className="material-symbols-outlined text-3xl text-primary/40">
                  person
                </span>
              )}
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1 [-webkit-font-smoothing:antialiased]">
                {member.name}
              </h3>
              <p className="text-sm text-gray-400 [-webkit-font-smoothing:antialiased]">
                Member Details
              </p>
            </div>
          </div>

          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            transition={APPLE_SPRING}
            className="text-gray-400 hover:text-white transition-colors will-change-transform"
            style={{ translateZ: 0 } as React.CSSProperties}
          >
            <span className="material-symbols-outlined">close</span>
          </motion.button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Email", member.email],
              ["Mobile Number", member.mobile || "N/A"],
              ["Joined", formatDate(member.created_at)],
              ["Account Status", member.status],
              ["Last Payment", formatDate(member.last_payment_date)],
              ["Next Billing", formatDate(member.membership_end_date)],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-gray-500 uppercase mb-1 [-webkit-font-smoothing:antialiased]">
                  {label}
                </p>
                {label === "Account Status" ? (
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-bold border
                    ${val === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                  >
                    {val}
                  </span>
                ) : (
                  <p className="text-sm text-white [-webkit-font-smoothing:antialiased]">
                    {val}
                  </p>
                )}
              </div>
            ))}
          </div>

          {member.membership_status !== "ACTIVE" && (
            <div className="flex gap-2 pt-4">
              {member.mobile && (
                <motion.button
                  whileHover={{ scale: 1.025, y: -2 }}
                  whileTap={{ scale: 0.975 }}
                  transition={APPLE_SPRING}
                  onClick={() =>
                    (window.location.href = `tel:${member.mobile}`)
                  }
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-bold
                             rounded-lg hover:bg-emerald-500 transition-colors duration-200
                             will-change-transform [-webkit-font-smoothing:antialiased]"
                  style={{ translateZ: 0 } as React.CSSProperties}
                >
                  Call Member
                </motion.button>
              )}
              {member.status !== "ACTIVE" && (
                <motion.button
                  whileHover={{ scale: 1.025, y: -2 }}
                  whileTap={{ scale: 0.975 }}
                  transition={APPLE_SPRING}
                  onClick={() => onDelete(member.id)}
                  className="flex-1 px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-500
                             text-sm font-bold rounded-lg hover:bg-red-600 hover:text-white
                             transition-colors duration-200 flex items-center justify-center gap-2
                             will-change-transform [-webkit-font-smoothing:antialiased]"
                  style={{ translateZ: 0 } as React.CSSProperties}
                >
                  <span className="material-symbols-outlined text-lg">
                    delete
                  </span>
                  Delete User
                </motion.button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile picture zoom — fixed overlay, no clipping */}
      <AnimatePresence>
        {ppHovered && member.profile_picture && (
          <motion.div
            className="fixed top-1/2 left-1/2 w-80 h-80 rounded-2xl border-4 border-primary/50
                       shadow-[0_0_50px_rgba(168,85,247,0.4)] overflow-hidden z-[100]
                       bg-[#161118] pointer-events-none will-change-transform"
            initial={{ opacity: 0, scale: 0.6, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.6, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", ...APPLE_SPRING }}
            style={{ translateZ: 0 } as React.CSSProperties}
          >
            <img
              src={getFullUrl(member.profile_picture) || ""}
              alt={member.name}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── VoucherRow ───────────────────────────────────────────────────────────────
const VoucherRow: React.FC<{
  v: AdminVoucher;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ v, onToggle, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isExpired = new Date(v.expiryDate) < new Date();
  const status = v.isSuspended ? "SUSPENDED" : isExpired ? "EXPIRED" : "ACTIVE";

  return (
    <React.Fragment>
      <tr
        className="hover:bg-white/[0.025] transition-colors duration-200 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="flex items-center gap-2 px-6 py-4">
          <span className="material-symbols-outlined text-sm text-gray-400">
            {expanded ? "expand_less" : "expand_more"}
          </span>
          <div
            className="font-bold text-white uppercase tracking-wider
                          [-webkit-font-smoothing:antialiased]"
          >
            {v.title}
          </div>
          <div className="text-[10px] text-primary font-mono">{v.code}</div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold
            [-webkit-font-smoothing:antialiased]
            ${status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-500"
                : status === "SUSPENDED"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-red-500/10 text-red-500"
              }`}
          >
            {status}
          </span>
        </td>
        <td className="px-6 py-4 text-xs [-webkit-font-smoothing:antialiased]">
          {formatDate(v.expiryDate)}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white [-webkit-font-smoothing:antialiased]">
              {v.usageCount}
            </span>
            <span className="text-[10px] text-gray-600 uppercase [-webkit-font-smoothing:antialiased]">
              Claims
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <div
            className="flex justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onToggle(v.id)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors duration-200
                [-webkit-font-smoothing:antialiased]
                ${v.isSuspended
                  ? "bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white"
                  : "bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white"
                }`}
            >
              {v.isSuspended ? "Resume" : "Suspend"}
            </button>
            <button
              onClick={() => onDelete(v.id)}
              className="px-3 py-1 rounded text-[10px] font-bold uppercase
                         bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white
                         transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {/* Expand row — height + opacity only */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={5} className="px-6 py-0 bg-black/20">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: APPLE_EASE }}
                className="overflow-hidden"
              >
                <div className="py-4 border-l-2 border-primary/30 ml-2 pl-6">
                  <h5
                    className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest
                                 [-webkit-font-smoothing:antialiased]"
                  >
                    Members who claimed this:
                  </h5>
                  {v.usedBy.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {v.usedBy.map((name, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            type: "spring",
                            ...APPLE_SPRING,
                            delay: i * 0.04,
                          }}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg
                                     text-xs text-white will-change-transform
                                     [-webkit-font-smoothing:antialiased]"
                          style={{ translateZ: 0 } as React.CSSProperties}
                        >
                          {name}
                        </motion.span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic [-webkit-font-smoothing:antialiased]">
                      No usage recorded yet.
                    </p>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
};

// ─── Admin ────────────────────────────────────────────────────────────────────
const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE'>('ALL');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [isPpHovered, setIsPpHovered] = useState(false);


  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [txnSearch, setTxnSearch] = useState('');
  const [sortRecent, setSortRecent] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Voucher Management States
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [newVoucher, setNewVoucher] = useState({ title: '', code: '', expiry: '', description: '' });
  const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>(null);
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, t, v] = await Promise.all([
          AdminService.getUsers(),
          AdminService.getTransactions(),
          AdminService.getVouchers(),
        ]);
        setMembers(Array.isArray(m) ? m : []);
        setTransactions(Array.isArray(t) ? t : []);
        setVouchers(Array.isArray(v) ? v : []);
      } catch (e) {
        console.error("Failed to fetch admin data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.membership_status === "ACTIVE")
      .length,
    expiredMembers: members.filter((m) => m.membership_status === "EXPIRED")
      .length,
    monthlyRevenue: transactions
      .filter(
        (t) =>
          t.status === "success" &&
          new Date(t.date).getMonth() === new Date().getMonth(),
      )
      .reduce((s, t) => s + Number(t.amount || 0), 0),
  };

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      (m.name?.toLowerCase()?.includes(q) ||
        m.email?.toLowerCase()?.includes(q) ||
        m.mobile?.toLowerCase()?.includes(q)) &&
      (filterStatus === "ALL" || m.membership_status === filterStatus)
    );
  });

  const handleLogout = useCallback(async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      navigate("/login");
    }
  }, [logout, navigate]);

  const handleDeleteUser = useCallback(async (id: string) => {
    if (!window.confirm("Permanently delete this user? This cannot be undone."))
      return;
    try {
      await AdminService.deleteUser(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setShowMemberModal(false);
      setSelectedMember(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete user");
    }
  }, []);

  const handleExportData = useCallback(() => {
    const csv = [
      ["Name", "Email", "Status", "Last Payment", "Phone", "Created At"],
      ...members.map((m) => [
        m.name,
        m.email,
        m.status,
        formatDate(m.last_payment_date),
        m.mobile || "",
        formatDate(m.created_at),
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), {
      href: url,
      download: `members-${new Date().toISOString().split("T")[0]}.csv`,
    }).click();
  }, [members]);

  const handleCreateVoucher = useCallback(async () => {
    if (!newVoucher.title || !newVoucher.code || !newVoucher.expiry) {
      alert("Please fill all fields");
      return;
    }
    try {
      const created = await AdminService.createVoucher({
        title: newVoucher.title,
        code: newVoucher.code.toUpperCase(),
        expiryDate: newVoucher.expiry,
        description: newVoucher.description,
        max_usage_per_user: 1,
        valid_from: new Date().toISOString(),
      });
      setVouchers((prev) => [created, ...prev]);
      setShowVoucherForm(false);
      setNewVoucher({ title: "", code: "", expiry: "", description: "" });
    } catch {
      alert("Failed to create voucher");
    }
  }, [newVoucher]);

  const toggleSuspendVoucher = useCallback(async (id: string) => {
    try {
      const res = await AdminService.toggleVoucherStatus(id);
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, isSuspended: !res.is_active } : v,
        ),
      );
    } catch {
      alert("Failed to toggle voucher status");
    }
  }, []);

  const handleDeleteVoucher = useCallback(async (id: string) => {
    if (!window.confirm("Delete this voucher?")) return;
    try {
      await AdminService.deleteVoucher(id);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    } catch {
      alert("Failed to delete voucher");
    }
  }, []);

const handleMarkAsPaid = async (memberId: string) => {
    if (window.confirm('Are you sure you want to mark this user as PAID manually? This will create a successful payment record and extend membership.')) {
            try {
                await AdminService.markAsPaid(Number(memberId));
        alert('User successfully marked as PAID.');

        // Refresh the whole page to force UI defaults update across the board as requested.
        window.location.reload();

        // Refresh members and transactions natively
        const [membersRes, transactionsRes] = await Promise.all([
          AdminService.getUsers(),
          AdminService.getTransactions()
        ]);
        setMembers(Array.isArray(membersRes) ? membersRes : []);
        setTransactions(Array.isArray(transactionsRes) ? transactionsRes : []);

        // Update currently viewed member
        if (membersRes) {
          const updated = (membersRes as Member[]).find(m => m.id === memberId);
          if (updated) setSelectedMember(updated);
        }
            } catch (error: any) {
                console.error("Failed to mark as paid", error);
        alert(error?.response?.data?.error || error.message || "Failed to mark as paid");
            }
        }
    };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <motion.div
            className="flex items-center gap-3 text-white/50 font-bold tracking-widest
                       uppercase text-xs [-webkit-font-smoothing:antialiased]"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.span
              className="material-symbols-outlined will-change-transform"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              style={{ translateZ: 0 } as React.CSSProperties}
            >
              progress_activity
            </motion.span>
            Loading Admin Panel…
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const STAT_CARDS = [
    {
      title: "Total Members",
      val: stats.totalMembers.toString(),
      icon: "groups",
      color: "text-blue-400",
    },
    {
      title: "Active Members",
      val: stats.activeMembers.toString(),
      icon: "check_circle",
      color: "text-emerald-400",
    },
    {
      title: "Expired Members",
      val: stats.expiredMembers.toString(),
      icon: "error",
      color: "text-red-400",
    },
    {
      title: "Monthly Revenue",
      val: `₹${stats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "payments",
      color: "text-primary",
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a0a1a] p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:gap-6">
          {/* ── Header ── */}
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: APPLE_EASE }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {/* Identity */}
              <div className="flex items-center gap-3">
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
                <h2
                  className="text-3xl font-black tracking-tight text-white
                               [-webkit-font-smoothing:antialiased]"
                >
                  Hi, Admin{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                    {user?.name || "Admin"}.
                  </span>
                </h2>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {[
                  {
                    label: "Export",
                    icon: "download",
                    onClick: handleExportData,
                    cls: "bg-white/5 border-white/10 text-white hover:bg-white/10",
                  },
                  {
                    label: "Logout",
                    icon: "logout",
                    onClick: handleLogout,
                    cls: "bg-red-600/10 border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white",
                  },
                ].map((btn) => (
                  <motion.button
                    key={btn.label}
                    onClick={btn.onClick}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={APPLE_SPRING}
                    className={`px-4 py-2.5 border text-xs font-bold uppercase tracking-widest
                               rounded-xl transition-colors duration-200 flex items-center gap-2
                               will-change-transform [-webkit-font-smoothing:antialiased] ${btn.cls}`}
                    style={{ translateZ: 0 } as React.CSSProperties}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {btn.icon}
                    </span>
                    {btn.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sub-nav */}
            <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {NAV_ITEMS.map((item, i) => {
                const active =
                  item.path === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.path);
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.36,
                      ease: APPLE_EASE,
                      delay: i * 0.05,
                    }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold
                                  uppercase tracking-widest transition-colors duration-200
                                  [-webkit-font-smoothing:antialiased]
                                  ${active
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
          </motion.div>

          {/* ── Route views — y-only, no scale ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: APPLE_EASE }}
              style={{ willChange: "opacity, transform" }}
            >
              <Routes>
                {/* ── Overview ── */}
                <Route
                  index
                  element={
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {STAT_CARDS.map((s, i) => (
                          <StatCard key={i} {...s} delay={i * 0.06} />
                        ))}
                      </div>

                      <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.28}
                        className="bg-[#161118] border border-white/10 rounded-2xl overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                          <h3
                            className="font-bold text-white uppercase tracking-tight text-sm
                                       flex items-center gap-2 [-webkit-font-smoothing:antialiased]"
                          >
                            <span className="material-symbols-outlined text-primary text-lg">
                              history
                            </span>
                            Recent Transactions
                          </h3>
                          <Link
                            to="/admin/transactions"
                            className="text-[10px] font-bold text-primary hover:text-white uppercase
                                     tracking-widest transition-colors [-webkit-font-smoothing:antialiased]"
                          >
                            View All Ledger
                          </Link>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-gray-400">
                            <thead className="text-[10px] uppercase font-bold text-gray-500 bg-white/5">
                              <tr>
                                {["Date", "User", "Amount", "Status"].map(
                                  (h, i) => (
                                    <th
                                      key={i}
                                      className={`px-6 py-4 [-webkit-font-smoothing:antialiased] ${i === 3 ? "text-right" : ""}`}
                                    >
                                      {h}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {[...transactions]
                                .sort(
                                  (a, b) =>
                                    new Date(b.date).getTime() -
                                    new Date(a.date).getTime(),
                                )
                                .slice(0, 5)
                                .map((txn, i) => (
                                  <motion.tr
                                    key={txn.id}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="visible"
                                    custom={0.32 + i * 0.04}
                                    className="hover:bg-white/[0.025] transition-colors duration-200"
                                  >
                                    <td className="px-6 py-4 text-xs text-gray-500 [-webkit-font-smoothing:antialiased]">
                                      {formatDate(txn.date)}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white [-webkit-font-smoothing:antialiased]">
                                      {(txn as any).user_name || "Unknown"}
                                    </td>
                                    <td className="px-6 py-4 font-mono [-webkit-font-smoothing:antialiased]">
                                      ₹
                                      {Number(txn.amount).toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold
                                      [-webkit-font-smoothing:antialiased]
                                      ${txn.status === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                                      >
                                        {txn.status.toUpperCase()}
                                      </span>
                                    </td>
                                  </motion.tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    </div>
                  }
                />

                <Route path="profile" element={<Profile />} />

                {/* ── Users ── */}
                <Route
                  path="users"
                  element={
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="bg-[#161118] border border-white/10 rounded-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white [-webkit-font-smoothing:antialiased]">
                          Member Directory
                        </h3>
                        <div className="flex items-center gap-3">
                          <select
                            value={filterStatus}
                            onChange={(e) =>
                              setFilterStatus(e.target.value as any)
                            }
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs
                                     text-gray-400 outline-none focus:border-primary cursor-pointer
                                     transition-colors duration-200 [-webkit-font-smoothing:antialiased] pr-6"
                          >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Quick search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs
                                     text-white outline-none focus:border-primary transition-colors duration-200
                                     [-webkit-font-smoothing:antialiased]"
                          />
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                          <thead className="text-[10px] uppercase font-bold text-gray-500 bg-white/5">
                            <tr>
                              {[
                                "Profile",
                                "Contact",
                                "Last Payment",
                                "Membership Status",
                                "Actions",
                              ].map((h, i) => (
                                <th
                                  key={i}
                                  className={`px-6 py-4 [-webkit-font-smoothing:antialiased] ${i === 4 ? "text-right" : ""}`}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredMembers.map((member, i) => (
                              <motion.tr
                                key={member.id}
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={i * 0.04}
                                className="hover:bg-white/[0.025] transition-colors duration-200"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded-full bg-primary/20 flex items-center
                                                  justify-center font-bold text-primary text-xs"
                                    >
                                      {member.name.charAt(0)}
                                    </div>
                                    <div className="font-bold text-white [-webkit-font-smoothing:antialiased]">
                                      {member.name}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 [-webkit-font-smoothing:antialiased]">
                                  {member.mobile}
                                </td>
                                <td
                                  className="px-6 py-4 text-white font-mono text-xs
                                             [-webkit-font-smoothing:antialiased]"
                                >
                                  {formatDate(member.last_payment_date)}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border
                                  [-webkit-font-smoothing:antialiased]
                                  ${member.membership_status === "ACTIVE"
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                      }`}
                                  >
                                    {member.membership_status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setShowMemberModal(true);
                                    }}
                                    className="text-primary hover:text-white font-bold text-[10px]
                                             uppercase underline decoration-primary/30
                                             transition-colors duration-200
                                             [-webkit-font-smoothing:antialiased]"
                                  >
                                    View More
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  }
                />

                {/* ── Transactions ── */}
                <Route
                  path="transactions"
                  element={
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="bg-[#161118] border border-white/10 rounded-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10 bg-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-white [-webkit-font-smoothing:antialiased]">
                            Financial Ledger
                          </h3>
                          <button
                            onClick={() => setSortRecent((p) => !p)}
                            className="text-[10px] font-bold uppercase tracking-widest text-primary
                                     hover:text-white transition-colors duration-200
                                     [-webkit-font-smoothing:antialiased]"
                          >
                            {sortRecent ? "Recent First ↓" : "Oldest First ↑"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="text"
                              placeholder="Search user name..."
                              value={txnSearch}
                              onChange={(e) => setTxnSearch(e.target.value)}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5
                                       text-xs text-white outline-none focus:border-primary
                                       transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                            />
                          </div>
                          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2">
                            <input
                              type="date"
                              value={dateRange.start}
                              onChange={(e) =>
                                setDateRange((p) => ({
                                  ...p,
                                  start: e.target.value,
                                }))
                              }
                              className="bg-transparent py-1.5 text-[10px] text-gray-300 outline-none
                                       focus:text-primary transition-colors [color-scheme:dark] w-24"
                            />
                            <span className="text-[10px] font-bold text-gray-600 uppercase mx-1">
                              to
                            </span>
                            <input
                              type="date"
                              value={dateRange.end}
                              onChange={(e) =>
                                setDateRange((p) => ({
                                  ...p,
                                  end: e.target.value,
                                }))
                              }
                              className="bg-transparent py-1.5 text-[10px] text-gray-300 outline-none
                                       focus:text-primary transition-colors [color-scheme:dark] w-24"
                            />
                          </div>
                          <button
                            onClick={() => {
                              setTxnSearch("");
                              setDateRange({ start: "", end: "" });
                            }}
                            className="px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-[10px]
                                     font-bold text-gray-400 uppercase tracking-widest
                                     hover:bg-white/10 hover:text-white transition-colors duration-200
                                     flex items-center gap-1.5 [-webkit-font-smoothing:antialiased]"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              restart_alt
                            </span>
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                          <thead className="text-[10px] uppercase font-bold text-gray-500 bg-white/5">
                            <tr>
                              {["Date", "User", "Amount", "Status"].map(
                                (h, i) => (
                                  <th
                                    key={i}
                                    className="px-6 py-4 [-webkit-font-smoothing:antialiased]"
                                  >
                                    {h}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {transactions
                              .filter((t) => {
                                const name =
                                  typeof t.user === "string"
                                    ? t.user
                                    : (t.user as any)?.name || "";
                                const ts = new Date(t.date).getTime();
                                const s = dateRange.start
                                  ? new Date(dateRange.start).getTime()
                                  : 0;
                                const e = dateRange.end
                                  ? new Date(dateRange.end).getTime() + 86400000
                                  : Infinity;
                                return (
                                  name
                                    .toLowerCase()
                                    .includes(txnSearch.toLowerCase()) &&
                                  ts >= s &&
                                  ts <= e
                                );
                              })
                              .sort((a, b) => {
                                const d =
                                  new Date(a.date).getTime() -
                                  new Date(b.date).getTime();
                                return sortRecent ? -d : d;
                              })
                              .map((txn, i) => (
                                <motion.tr
                                  key={txn.id}
                                  variants={fadeUp}
                                  initial="hidden"
                                  animate="visible"
                                  custom={i * 0.03}
                                  className="hover:bg-white/[0.025] transition-colors duration-200"
                                >
                                  <td className="px-6 py-4 text-xs [-webkit-font-smoothing:antialiased]">
                                    {formatDate(txn.date)}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-white [-webkit-font-smoothing:antialiased]">
                                    {txn.user_name || "Unknown"}
                                  </td>
                                  <td className="px-6 py-4 font-mono [-webkit-font-smoothing:antialiased]">
                                    ₹
                                    {Number(txn.amount).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold
                                    [-webkit-font-smoothing:antialiased]
                                    ${txn.status === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                                    >
                                      {txn.status.toUpperCase()}
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  }
                />

                {/* ── Vouchers ── */}
                <Route
                  path="vouchers"
                  element={
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="space-y-6"
                    >
                      <div className="bg-[#161118] border border-white/10 rounded-2xl p-6">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                          <h3
                            className="text-xl font-bold text-white flex items-center gap-2
                                       [-webkit-font-smoothing:antialiased]"
                          >
                            <span className="material-symbols-outlined text-primary">
                              confirmation_number
                            </span>
                            Voucher Management
                          </h3>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group min-w-[200px]">
                              <span
                                className="material-symbols-outlined absolute left-3 inset-y-0 my-auto h-fit
                                             flex items-center text-gray-500 text-sm
                                             group-focus-within:text-primary transition-colors pointer-events-none"
                              >
                                search
                              </span>
                              <input
                                type="text"
                                placeholder="Search title/code..."
                                value={voucherSearch}
                                onChange={(e) =>
                                  setVoucherSearch(e.target.value)
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2
                                         text-xs text-white outline-none focus:border-primary/50
                                         transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                              />
                            </div>
                            <select
                              value={voucherStatusFilter}
                              onChange={(e) =>
                                setVoucherStatusFilter(e.target.value as any)
                              }
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs
                                       text-gray-400 outline-none focus:border-primary/50 cursor-pointer
                                       transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                            >
                              <option value="all">All Status</option>
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="expired">Expired</option>
                            </select>
                            <motion.button
                              onClick={() => setShowVoucherForm((p) => !p)}
                              whileHover={{ scale: 1.04, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              transition={APPLE_SPRING}
                              className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-widest
                                       rounded-xl hover:bg-primary/80 transition-colors duration-200
                                       flex items-center gap-2 will-change-transform
                                       [-webkit-font-smoothing:antialiased]"
                              style={{ translateZ: 0 } as React.CSSProperties}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {showVoucherForm ? "close" : "add"}
                              </span>
                              {showVoucherForm ? "Cancel" : "New Voucher"}
                            </motion.button>
                          </div>
                        </div>

                        {/* Voucher form */}
                        <AnimatePresence>
                          {showVoucherForm && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: "auto" }}
                              exit={{ opacity: 0, y: -8, height: 0 }}
                              transition={{ duration: 0.28, ease: APPLE_EASE }}
                              className="mb-8 overflow-hidden"
                            >
                              <div
                                className="p-6 bg-white/5 border border-white/10 rounded-xl
                                            grid grid-cols-1 md:grid-cols-3 gap-4"
                              >
                                {[
                                  {
                                    label: "Voucher Title",
                                    key: "title",
                                    ph: "e.g. Summer Discount",
                                    cls: "",
                                  },
                                  {
                                    label: "Description",
                                    key: "description",
                                    ph: "Voucher Description",
                                    cls: "md:col-span-2",
                                  },
                                  {
                                    label: "Voucher Code",
                                    key: "code",
                                    ph: "e.g. SUMMER369",
                                    cls: "",
                                  },
                                ].map((f) => (
                                  <div key={f.key} className={f.cls}>
                                    <label
                                      className="text-[10px] font-bold text-gray-500 uppercase mb-1 block
                                                    [-webkit-font-smoothing:antialiased]"
                                    >
                                      {f.label}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={f.ph}
                                      value={(newVoucher as any)[f.key]}
                                      onChange={(e) =>
                                        setNewVoucher((p) => ({
                                          ...p,
                                          [f.key]: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2
                                               text-xs text-white outline-none focus:border-primary
                                               transition-colors duration-200 [-webkit-font-smoothing:antialiased]"
                                    />
                                  </div>
                                ))}
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <label
                                      className="text-[10px] font-bold text-gray-500 uppercase mb-1 block
                                                    [-webkit-font-smoothing:antialiased]"
                                    >
                                      Expiry Date
                                    </label>
                                    <input
                                      type="date"
                                      value={newVoucher.expiry}
                                      onChange={(e) =>
                                        setNewVoucher((p) => ({
                                          ...p,
                                          expiry: e.target.value,
                                        }))
                                      }
                                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2
                                               text-xs text-white outline-none focus:border-primary
                                               transition-colors duration-200 [color-scheme:dark]"
                                    />
                                  </div>
                                  <motion.button
                                    onClick={handleCreateVoucher}
                                    whileHover={{ scale: 1.04, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={APPLE_SPRING}
                                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase
                                             tracking-widest rounded-lg hover:bg-emerald-500
                                             transition-colors duration-200 will-change-transform
                                             [-webkit-font-smoothing:antialiased]"
                                    style={
                                      { translateZ: 0 } as React.CSSProperties
                                    }
                                  >
                                    Create
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-gray-400">
                            <thead className="text-[10px] uppercase font-bold text-gray-500 bg-white/5">
                              <tr>
                                {[
                                  "Voucher (Title/Code)",
                                  "Status",
                                  "Expiry",
                                  "Usage",
                                  "Actions",
                                ].map((h, i) => (
                                  <th
                                    key={i}
                                    className={`px-6 py-4 [-webkit-font-smoothing:antialiased] ${i === 4 ? "text-right" : ""}`}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {vouchers
                                .filter((v) => {
                                  const isExpired =
                                    new Date(v.expiryDate) < new Date();
                                  const s = v.isSuspended
                                    ? "suspended"
                                    : isExpired
                                      ? "expired"
                                      : "active";
                                  return (
                                    (v.title
                                      .toLowerCase()
                                      .includes(voucherSearch.toLowerCase()) ||
                                      v.code
                                        .toLowerCase()
                                        .includes(
                                          voucherSearch.toLowerCase(),
                                        )) &&
                                    (voucherStatusFilter === "all" ||
                                      s === voucherStatusFilter)
                                  );
                                })
                                .map((v) => (
                                  <VoucherRow
                                    key={v.id}
                                    v={v}
                                    onToggle={toggleSuspendVoucher}
                                    onDelete={handleDeleteVoucher}
                                  />
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  }
                />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Member Details Modal */}
        <AnimatePresence>
          {showMemberModal && selectedMember && (
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMemberModal(false)}
            >
              <motion.div
                className="bg-[#161118] border border-white/10 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer relative"
                      onMouseEnter={() => setIsPpHovered(true)}
                      onMouseLeave={() => setIsPpHovered(false)}
                    >
                      {selectedMember.profile_picture ? (
                        <img src={getFullUrl(selectedMember.profile_picture) || ''} alt={selectedMember.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-primary/40">person</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {selectedMember.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Member Details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMemberModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                      <p className="text-sm text-white">{selectedMember.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Mobile Number</p>
                      <p className="text-sm text-white">{selectedMember.mobile || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Joined</p>
                      <p className="text-sm text-white">{formatDate(selectedMember.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Account Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${selectedMember.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                      >
                        {selectedMember.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Last Payment</p>
                      <p className="text-sm text-white">{formatDate(selectedMember.last_payment_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Next Billing</p>
                      <p className="text-sm text-white">{formatDate(selectedMember.membership_end_date)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {/* <button
                                            onClick={() => handleSendReminder(selectedMember.id)}
                                            className="flex-1 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/80 transition-all"
                                        >
                                            Send Reminder
                                        </button> */}
                    {selectedMember.membership_status !== 'ACTIVE' && (

                      <>
                        {selectedMember.mobile && (
                          <button
                            onClick={() => window.location.href = `tel:${selectedMember.mobile}`}
                            className="flex-1 px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-sm font-bold rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">call</span>
                            <span>Call Member</span>
                          </button>
                        )}
                        {selectedMember.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleDeleteUser(selectedMember.id)}
                            className="flex-1 px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-500 text-sm font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            <span>Delete User</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkAsPaid(selectedMember.id)}
                          className="flex-1 px-4 py-2 bg-emerald-600 border border-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">payments</span>
                          <span>Mark as PAID</span>
                        </button>
                        {/* <button
                                                    onClick={() => handleRetryPayment(selectedMember.id)}
                                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all"
                                                >
                                                    Retry Payment
                                                </button>
                                                <button
                                                    onClick={() => handleCancelMembership(selectedMember.id)}
                                                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-500 transition-all"
                                                >
                                                    Cancel Membership
                                                </button> */}
                      </>


                    )}
                  </div>
                </div>
              </motion.div>

              {/* Hover Zoom Popup (Fixed at overlay level to avoid clipping) */}
              <AnimatePresence>
                {isPpHovered && selectedMember.profile_picture && (
                  <motion.div
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-2xl border-4 border-primary/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] overflow-hidden z-[100] bg-[#161118] pointer-events-none"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <img
                      src={getFullUrl(selectedMember.profile_picture) || ''}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout >
  );
};

export default Admin;