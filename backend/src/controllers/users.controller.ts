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

export const UserController = {
    async me(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(404).json({ error: 'User not found' });
            res.json(context);
        } catch (err) {
            res.status(500).json({ error: 'Error fetching user profile' });
        }
    },

    async list(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            let query = supabaseAdmin
                .from('users')
                .select('*');

            if (context.role !== 'superadmin') {
                if (!context.company_id) return res.json([]);
                query = query.eq('company_id', context.company_id);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Error fetching users' });
        }
    },

    async create(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context || !context.company_id) {
                if (context?.role !== 'superadmin') {
                    return res.status(403).json({ error: 'User must be linked to a company to create members' });
                }
            }

            // Access Control: Only 'admin' or 'superadmin' can create users
            if (context.role !== 'admin' && context.role !== 'superadmin') {
                return res.status(403).json({ error: 'Permissão negada. Apenas Administradores podem gerenciar usuários.' });
            }

            const { email, password, name, role, phone, companyId } = req.body;

            // Determine target company
            let targetCompanyId = context?.company_id;
            if (context?.role === 'superadmin' && companyId) {
                targetCompanyId = companyId;
            }

            // 1. Create user in Supabase Auth
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name }
            });

            if (authError) throw authError;

            // 2. Sync to public.users table
            const { data, error: syncError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: authUser.user.id,
                    name,
                    email,
                    phone,
                    company_id: targetCompanyId, // Link to target company
                    role: role || 'visualizacao'
                })
                .select()
                .single();

            if (syncError) {
                // Cleanup auth user if sync fails
                await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
                throw syncError;
            }

            res.status(201).json(data);
        } catch (err: any) {
            console.error('Create user error:', err);
            res.status(400).json({ error: err.message || 'Error creating user' });
        }
    },

    // In a real app, creating a user would involve Supabase Auth as well.
    // For now, this just lists and manages roles within the tenant.
    async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const context = await getUserContext(req.user.id);

            // Access Control
            if (!context || (context.role !== 'admin' && context.role !== 'superadmin')) {
                return res.status(403).json({ error: 'Permissão negada.' });
            }

            const { name, role, phone, companyId } = req.body;
            const updateData: any = { name, role, phone };

            if (context?.role === 'superadmin' && companyId) {
                updateData.company_id = companyId;
            }

            const { error } = await supabaseAdmin
                .from('users')
                .update(updateData)
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
            const context = await getUserContext(req.user.id);

            // Access Control
            if (!context || (context.role !== 'admin' && context.role !== 'superadmin')) {
                return res.status(403).json({ error: 'Permissão negada.' });
            }

            // 1. Remove from public.users table (or mark inactive, but user asked to delete/deactivate options, we'll do delete for now)
            const { error: dbError } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Remove from Supabase Auth
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) {
                console.warn('Failed to delete auth user, but database user deleted', authError);
                // Not throwing here to avoid confusing the client if the main record is gone
            }

            res.json({ success: true });
        } catch (err: any) {
            console.error('Delete user error', err);
            res.status(400).json({ error: 'Delete failed' });
        }
    }
};
