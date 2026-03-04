import { useState, useEffect } from 'react';
import { MembershipService } from '../services/MembershipService';
import { MembershipDetails, Voucher, Transaction } from '../types/membership';

export const useMembership = () => {
    const [details, setDetails] = useState<MembershipDetails | null>(null);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [detailsRes, vouchersRes, transactionsRes] = await Promise.all([
                    MembershipService.getMembershipDetails(),
                    MembershipService.getVouchers(),
                    MembershipService.getTransactions(),
                ]);
                setDetails(detailsRes);
                setVouchers(vouchersRes);
                setTransactions(transactionsRes);
            } catch (err) {
                setError('Failed to load membership data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const isRenewalAllowed = () => {
        if (!details) return false; // Keep the initial check for details
        if (details.status === 'EXPIRED' || details.status === 'INACTIVE') return true;

        const expiry = new Date(details.expiryDate);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 5;
    };

    const claimVoucher = async (voucherId: string) => {
        try {
            const updatedVoucher = await MembershipService.claimVoucher(voucherId);
            setVouchers(prev => prev.map(v => v.id === voucherId ? updatedVoucher : v));
        } catch (err) {
            setError('Failed to claim voucher');
            throw err;
        }
    };

    return { details, vouchers, transactions, isLoading, error, isRenewalAllowed, claimVoucher };
};
