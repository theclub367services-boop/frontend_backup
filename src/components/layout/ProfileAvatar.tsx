import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getFullUrl } from '../../utils/url';

const ProfileAvatar: React.FC = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const confirmLogout = window.confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            await logout();
            setIsOpen(false);
            navigate('/login');
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-white/10 hover:border-primary/50 transition-colors"
                whileTap={{ scale: 0.95 }}
            >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center border border-white/5">
                    {user.profile_picture ? (
                        <img src={getFullUrl(user.profile_picture) || ''} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="material-symbols-outlined text-[20px] text-primary">person</span>
                    )}
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-56 bg-[#161118]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-white/10 bg-white/5">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-500 truncate uppercase tracking-widest">{user.role}</p>
                        </div>

                        <div className="p-2">
                            <button
                                onClick={() => {
                                    if (user.role?.toLowerCase() === 'user' && user.status === 'PENDING') {
                                        alert("Don't have access Until you complete payment");
                                        navigate('/payment');
                                    } else {
                                        navigate(user.role?.toLowerCase() === 'admin' ? '/admin/profile' : '/dashboard/profile');
                                    }
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                            >
                                <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">account_circle</span>
                                View Profile
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 transition-all group"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileAvatar;
