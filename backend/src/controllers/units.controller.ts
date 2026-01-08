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

export const UnitController = {
    async list(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            let query = supabaseAdmin
                .from('units')
                .select('*');

            if (context.role !== 'superadmin') {
                if (!context.company_id) return res.json([]);
                query = query.eq('company_id', context.company_id);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Error fetching units' });
        }
    },

    async create(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            if (context.role === 'visualizacao') {
                return res.status(403).json({ error: 'Perfil de visualização não pode criar registros.' });
            }

            let targetCompanyId = context.company_id;
            if (context.role === 'superadmin' && req.body.companyId) {
                targetCompanyId = req.body.companyId;
            }

            if (!targetCompanyId) {
                return res.status(400).json({ error: 'É necessário vincular a uma empresa.' });
            }

            const { name, address, phone } = req.body;
            const { data, error } = await supabaseAdmin
                .from('units')
                .insert({ company_id: targetCompanyId, name, address, phone })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err: any) {
            console.error('Error creating unit:', err);
            res.status(400).json({ error: err.message || 'Error creating unit' });
        }
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { name, address, phone } = req.body;

            // Check permission
            const context = await getUserContext(req.user.id);
            if (context?.role === 'visualizacao') {
                return res.status(403).json({ error: 'Perfil de visualização não pode editar registros.' });
            }

            const { error } = await supabaseAdmin
                .from('units')
                .update({ name, address, phone })
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

            // Check permission
            const context = await getUserContext(req.user.id);
            if (context?.role === 'visualizacao') {
                return res.status(403).json({ error: 'Perfil de visualização não pode excluir registros.' });
            }

            const { error } = await supabaseAdmin
                .from('units')
                .delete()
                .eq('id', id);
            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ error: 'Delete failed' });
        }
    }
};
