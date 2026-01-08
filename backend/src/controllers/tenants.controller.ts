import { Response } from 'express';
import { supabaseAdmin } from '../server';
import { AuthRequest } from '../middleware/auth';

export const TenantController = {
    // List all companies (Superadmin only feature ideally)
    async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user.id;

            // Get user role context
            const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                return res.status(403).json({ error: 'Access denied' });
            }

            if (userData.role !== 'superadmin') {
                // If not superadmin, return empty array to indicate 'no tenants to manage/select'
                // This effectively hides options in the frontend that rely on this list
                return res.json([]);
            }

            const { data, error } = await supabaseAdmin
                .from('companies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch tenants' });
        }
    },

    async create(req: AuthRequest, res: Response) {
        try {
            const { name, cnpj, address, phone, email } = req.body;

            if (!name || !cnpj) {
                return res.status(400).json({ error: 'Name and CNPJ are required' });
            }

            const { data, error } = await supabaseAdmin
                .from('companies')
                .insert({ name, cnpj, address, phone, email })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err: any) {
            res.status(400).json({ error: err.message || 'Failed to create tenant' });
        }
    },

    // Link a user to a tenant (Manual provisioning for MVP)
    async linkUser(req: AuthRequest, res: Response) {
        try {
            const { userId, companyId, role } = req.body;

            const { error } = await supabaseAdmin
                .from('users')
                .update({ company_id: companyId, role: role || 'admin' })
                .eq('id', userId);

            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ error: 'Failed to link user' });
        }
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { name, cnpj, address, phone, email } = req.body;

            const { error } = await supabaseAdmin
                .from('companies')
                .update({ name, cnpj, address, phone, email })
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true });
        } catch (err: any) {
            res.status(400).json({ error: err.message || 'Update failed' });
        }
    },

    async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            // Note: This might fail if there are foreign keys (users, payables) linked to this company.
            // In a real app we'd need to cascade or check constraints. For now we assume ON DELETE CASCADE or manual cleanup isn't strictly enforced by me here.
            const { error } = await supabaseAdmin
                .from('companies')
                .delete()
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true });
        } catch (err: any) {
            res.status(400).json({ error: err.message || 'Delete failed' });
        }
    }
};
