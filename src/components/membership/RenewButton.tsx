import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentService } from '../../services/PaymentService';
import { useNavigate } from 'react-router-dom';

interface RenewButtonProps {
    status: string;
    expiryDate: string;
    amount: number;
    email: string;
    name: string;
    mobile: string;
}

const RenewButton: React.FC<RenewButtonProps> = ({ status, expiryDate, amount, email, name, mobile }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const canRenew = () => {
        if (status === 'EXPIRED' || status === 'INACTIVE') return true;

        // If active, allow renewal if within 5 days of expiry
        const expiry = new Date(expiryDate);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 5;
    };

    const handlePayment = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            await PaymentService.handlePayment({
                prefill: {
                    name,
                    email,
                    contact: mobile
                },
                onSuccess: (verifyRes) => {
                    if (verifyRes) {
                        alert('Membership renewed successfully!');
                        navigate('/dashboard');
                    }
                    setIsProcessing(false);
                },
                onDismiss: () => {
                    setIsProcessing(false);
                },
                onError: (error: any) => {
                    console.error('Payment Error:', error);
                    const errorMsg = error.message || 'Failed to initiate payment. Please try again.';
                    alert(errorMsg);
                    setIsProcessing(false);
                }
            });
        } catch (error) {
            console.error('Payment Initiation Error:', error);
            setIsProcessing(false);
        }
    };

    if (!canRenew()) {
        return (
            <div className="group relative">
                <button
                    disabled
                    className="w-full py-4 bg-gray-500/10 border border-white/5 text-gray-500 text-xs font-bold uppercase tracking-[0.2em] rounded-2xl cursor-not-allowed"
                >
                    Renew Locked
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Renewal opens 5 days before expiry
                </div>
            </div>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={isProcessing}
            className={`w-full py-4 ${isProcessing ? 'bg-primary/50' : 'bg-primary'} text-white text-xs font-bold uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2`}
        >
            {isProcessing ? (
                <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Renew Membership
                </>
            )}
        </motion.button>
    );
};

export default RenewButton;
