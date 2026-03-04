import { User } from '../types/auth';
import { Transaction } from '../types/membership';
import api from '../utils/api';

export const PaymentService = {
    createPayment: async (data: any): Promise<any> => {
        return await api.post('/payments/create/', data);
    }
};

export const AdminService = {
    getUsers: async (): Promise<User[]> => {
        return await api.get<User[]>('/admin/users/');
    },

    getTransactions: async (): Promise<Transaction[]> => {
        return await api.get<Transaction[]>('/admin/transactions/');
    },

    getCollections: async (): Promise<{ total_last_30_days: number }> => {
        return await api.get<{ total_last_30_days: number }>('/admin/collections/');
    },

    getVouchers: async (): Promise<any[]> => {
        return await api.get<any[]>('/admin/vouchers/');
    },

    createVoucher: async (data: any): Promise<any> => {
        return await api.post('/admin/vouchers/create/', data);
    },

    toggleVoucherStatus: async (id: string): Promise<any> => {
        return await api.patch(`/admin/vouchers/${id}/toggle/`);
    },

    deleteVoucher: async (id: string): Promise<any> => {
        return await api.delete(`/admin/vouchers/${id}/delete/`);
    },

    deleteUser: async (id: string): Promise<any> => {
        return await api.delete(`/admin/users/${id}/delete/`);
    },

    markAsPaid: async (userId: number): Promise<any> => {
        return await api.post(`/admin/mark-as-paid/${userId}/`);
    }
};

