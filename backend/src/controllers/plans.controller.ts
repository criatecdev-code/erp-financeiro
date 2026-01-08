import { Response } from 'express';
import { supabaseAdmin } from '../server';
import { AuthRequest } from '../middleware/auth';

const getUserContext = async (userId: string) => {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('company_id, role')
        .eq('id', userId)
        .single();
    if (error || !data) return null;
    return data;
};

export const PlanController = {
    async list(req: AuthRequest, res: Response) {
        try {
            const { data, error } = await supabaseAdmin
                .from('plans')
                .select('*')
                .order('price');

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch plans' });
        }
    },

    async create(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (context?.role !== 'superadmin') {
                return res.status(403).json({ error: 'Only superadmins can create plans' });
            }

            const { name, price, description, features, interval } = req.body;

            const { data, error } = await supabaseAdmin
                .from('plans')
                .insert({ name, price, description, features, interval })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err: any) {
            res.status(400).json({ error: err.message || 'Failed to create plan' });
        }
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { name, price, description, features, interval } = req.body;

            const { error } = await supabaseAdmin
                .from('plans')
                .update({ name, price, description, features, interval })
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ error: 'Update failed' });
        }
    },

    async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await supabaseAdmin.from('plans').delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ error: 'Delete failed' });
        }
    }
};
