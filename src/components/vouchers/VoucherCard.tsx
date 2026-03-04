import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface VoucherCardProps {
    id: string;
    title: string;
    description: string;
    code: string;
    isClaimed: boolean;
    membershipStatus: string;
    onClaim: (id: string) => void;
}

const VoucherCard: React.FC<VoucherCardProps> = ({ id, title, description, code, isClaimed, membershipStatus, onClaim }) => {
    const [claiming, setClaiming] = useState(false);
    const isActive = membershipStatus === 'ACTIVE' || membershipStatus === 'active';

    const handleClaim = async () => {
        if (!isActive || isClaimed || claiming) return;
        setClaiming(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        onClaim(id);
        setClaiming(false);
    };

    return (
        <motion.div
            className="bg-[#161118]/50 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group"
            whileHover={{ y: -5 }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">confirmation_number</span>
                </div>
                {isClaimed && (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 rounded-md uppercase">
                        Claimed
                    </span>
                )}
            </div>

            <h4 className="text-white font-bold mb-1">{title}</h4>
            <p className="text-gray-500 text-xs mb-6 line-clamp-2">{description}</p>

            <div className="space-y-4">
                <div className="relative group">
                    <div className={`p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-center tracking-widest text-sm transition-all ${!isClaimed ? 'blur-sm select-none' : 'text-primary'}`}>
                        {code}
                    </div>
                    {!isClaimed && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Claim to Reveal
                        </div>
                    )}
                </div>

                {!isClaimed ? (
                    <button
                        onClick={handleClaim}
                        disabled={!isActive || claiming}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${!isActive
                            ? 'bg-gray-500/10 text-gray-500 border border-white/5 cursor-not-allowed'
                            : 'bg-white/5 text-white hover:bg-primary hover:text-white border border-white/10'
                            }`}
                    >
                        {!isActive ? 'Membership Required' : (claiming ? 'Claiming...' : 'Claim Reward')}
                    </button>
                ) : (
                    <button
                        disabled
                        className="w-full py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-default"
                    >
                        Successfully Claimed
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default VoucherCard;
