import { Response } from 'express';
import { supabaseAdmin } from '../server';
import { AuthRequest } from '../middleware/auth';

const getUserContext = async (userId: string) => {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('company_id, role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user context:', error);
        return null;
    }
    return data;
};

export const PayableController = {
    async list(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            let query = supabaseAdmin
                .from('accounts_payable')
                .select(`
                    *,
                    suppliers!supplier_id (name),
                    expense_categories!category_id (name),
                    units!unit_id (name)
                `);

            // Strict Tenant Isolation: Always filter by company_id, even for Superadmin
            if (!context.company_id) return res.status(200).json([]);
            query = query.eq('company_id', context.company_id);

            const { data, error } = await query.order('due_date', { ascending: true });
            if (error) throw error;

            res.json(data);
        } catch (err: any) {
            console.error('List payables error:', err);
            res.status(500).json({ error: 'Failed to fetch payables' });
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

            const {
                supplier_id, unit_id, category_id,
                document_number, due_date, amount, notes, barcode_or_pix
            } = req.body;

            if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

            const { data, error } = await supabaseAdmin
                .from('accounts_payable')
                .insert({
                    company_id: targetCompanyId,
                    supplier_id, unit_id, category_id,
                    document_number, due_date, amount, notes, barcode_or_pix,
                    created_by: req.user.id
                })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err: any) {
            console.error('Create payable error:', err);
            res.status(400).json({ error: err.message });
        }
    },

    async pay(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { payment_date } = req.body;

            // Check permission
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            if (context.role === 'visualizacao') {
                return res.status(403).json({ error: 'Perfil de visualização não pode realizar pagamentos.' });
            }

            let query = supabaseAdmin
                .from('accounts_payable')
                .update({
                    payment_date: payment_date || new Date().toISOString(),
                })
                .eq('id', id);

            // Tenant Isolation
            if (context.role !== 'superadmin') {
                query = query.eq('company_id', context.company_id);
            }

            const { error } = await query;

            if (error) throw error;
            res.json({ success: true, message: 'Marked as paid' });
        } catch (err: any) {
            console.error('Pay error:', err);
            res.status(400).json({ error: err.message });
        }
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            // Check permission
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            if (context.role === 'visualizacao') {
                return res.status(403).json({ error: 'Perfil de visualização não pode editar registros.' });
            }

            const {
                supplier_id, unit_id, category_id,
                document_number, due_date, amount, notes, barcode_or_pix
            } = req.body;

            let query = supabaseAdmin
                .from('accounts_payable')
                .update({
                    supplier_id, unit_id, category_id,
                    document_number, due_date, amount, notes, barcode_or_pix
                })
                .eq('id', id);

            // Tenant Isolation
            if (context.role !== 'superadmin') {
                query = query.eq('company_id', context.company_id);
            }

            const { error } = await query;

            if (error) throw error;
            res.json({ success: true });
        } catch (err: any) {
            console.error('Update payable error:', err);
            res.status(400).json({ error: err.message });
        }
    },

    async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            // Check permission
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            if (context.role === 'visualizacao') {
                return res.status(403).json({ error: 'Perfil de visualização não pode excluir registros.' });
            }

            let query = supabaseAdmin
                .from('accounts_payable')
                .delete()
                .eq('id', id);

            // Tenant Isolation
            if (context.role !== 'superadmin') {
                query = query.eq('company_id', context.company_id);
            }

            const { error } = await query;

            if (error) throw error;
            res.json({ success: true });
        } catch (err: any) {
            console.error('Delete payable error:', err);
            res.status(400).json({ error: err.message });
        }
    },

    async dashboardStats(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

            // Helper to create base query
            const getBase = () => {
                let q = supabaseAdmin.from('accounts_payable').select('amount');
                if (context.company_id) {
                    q = q.eq('company_id', context.company_id);
                } else {
                    // Force empty result if no company_id (e.g. global superadmin without context)
                    q = q.eq('id', '00000000-0000-0000-0000-000000000000'); // UUID dummy
                }
                return q;
            };

            if (!context.company_id) {
                return res.json({ totalOpen: 0, totalOverdue: 0, totalToday: 0, totalMonthPaid: 0, totalMonthExpected: 0 });
            }

            const [
                { data: openData },
                { data: overdueData },
                { data: todayData },
                { data: monthPaidData },
                { data: monthExpectedData }
            ] = await Promise.all([
                getBase().is('payment_date', null),
                getBase().is('payment_date', null).lt('due_date', today),
                getBase().is('payment_date', null).eq('due_date', today),
                getBase().not('payment_date', 'is', null).gte('payment_date', startOfMonth).lte('payment_date', endOfMonth),
                getBase().gte('due_date', startOfMonth).lte('due_date', endOfMonth),
            ]);

            const sum = (data: any[] | null) => data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            res.json({
                totalOpen: sum(openData),
                totalOverdue: sum(overdueData),
                totalToday: sum(todayData),
                totalMonthPaid: sum(monthPaidData),
                totalMonthExpected: sum(monthExpectedData)
            });

        } catch (err) {
            console.error('Stats error:', err);
            res.status(500).json({ error: 'Stats failed' });
        }
    }
};
