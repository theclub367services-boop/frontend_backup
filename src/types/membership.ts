export type MembershipStatus = 'active' | 'expiring' | 'expired' | 'inactive';
export type AutopayStatus = 'active' | 'failed' | 'inactive';

export interface MembershipDetails {
    status: MembershipStatus;
    expiryDate: string;
    nextBillingDate: string;
    autopayStatus: AutopayStatus;
}

export interface Transaction {
    id: string;
    user: string;
    date: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    method: string;
}

export interface Voucher {
    id: string;
    title: string;
    description: string;
    isClaimed: boolean;
}
