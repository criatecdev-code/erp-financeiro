import { Response } from 'express';
import { supabaseAdmin } from '../server';
import { AuthRequest } from '../middleware/auth';
import * as xlsx from 'xlsx';

const getUserContext = async (userId: string) => {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('company_id, role')
        .eq('id', userId)
        .single();
    if (error || !data) return null;
    return data;
};

export const ReportController = {
    async dashboardDetailedStats(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context || !context.company_id) {
                // Return empty stats if no company context attached
                return res.json({
                    byUnit: [], byCategory: [],
                    currentMonth: { paid: 0, payable: 0, total: 0 },
                    nextMonth: { payable: 0, total: 0 }
                });
            }

            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

            const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
            const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

            let query = supabaseAdmin
                .from('accounts_payable')
                .select(`
                    amount,
                    due_date,
                    payment_date,
                    expense_categories (name),
                    units (name)
                `);

            query = query.eq('company_id', context.company_id);

            const { data, error } = await query;
            if (error) throw error;

            const stats = {
                byUnit: {} as any,
                byCategory: {} as any,
                currentMonth: { paid: 0, payable: 0, total: 0 },
                nextMonth: { payable: 0, total: 0 }
            };

            data?.forEach((p: any) => {
                const amount = Number(p.amount);
                const isPaid = !!p.payment_date;
                const unitName = (p.units as any)?.name || 'Sem Unidade';
                const catName = (p.expense_categories as any)?.name || 'Sem Categoria';

                // Aggregate by Unit
                if (!stats.byUnit[unitName]) stats.byUnit[unitName] = { paid: 0, payable: 0 };
                if (isPaid) stats.byUnit[unitName].paid += amount;
                else stats.byUnit[unitName].payable += amount;

                // Aggregate by Category
                if (!stats.byCategory[catName]) stats.byCategory[catName] = { paid: 0, payable: 0 };
                if (isPaid) stats.byCategory[catName].paid += amount;
                else stats.byCategory[catName].payable += amount;

                // Time Periods
                // Current Month
                if (p.due_date >= startOfMonth && p.due_date <= endOfMonth) {
                    stats.currentMonth.total += amount;
                    if (isPaid) stats.currentMonth.paid += amount;
                    else stats.currentMonth.payable += amount;
                }

                // Next Month (Only payables usually, but total includes everything due then)
                if (p.due_date >= startOfNextMonth && p.due_date <= endOfNextMonth) {
                    stats.nextMonth.total += amount;
                    if (!isPaid) stats.nextMonth.payable += amount;
                }
            });

            // Convert Objects to Arrays for Frontend
            const toArray = (obj: any) => Object.entries(obj).map(([name, val]: any) => ({
                name,
                paid: val.paid,
                payable: val.payable,
                total: val.paid + val.payable
            }));

            res.json({
                byUnit: toArray(stats.byUnit),
                byCategory: toArray(stats.byCategory),
                currentMonth: stats.currentMonth,
                nextMonth: stats.nextMonth
            });

        } catch (err: any) {
            console.error('Detailed stats error:', err);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    },

    async payablesSummary(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            const { startDate, endDate, month, categoryId, unitId, companyId, dateType } = req.query;
            const filterDateCol = (dateType === 'created_at') ? 'created_at' : 'due_date';

            let query = supabaseAdmin
                .from('accounts_payable')
                .select(`
                    amount,
                    due_date,
                    created_at,
                    payment_date,
                    suppliers (name),
                    expense_categories!inner (id, name),
                    units!inner (id, name),
                    companies!inner (id, name)
                `);

            if (!context.company_id) return res.json({});
            query = query.eq('company_id', context.company_id);

            if (startDate) query = query.gte(filterDateCol, startDate);
            if (endDate) query = query.lte(filterDateCol, endDate);

            if (month) {
                const start = `${month}-01`;
                // Calculate last day of month
                const [y, m] = (month as string).split('-');
                const end = new Date(Number(y), Number(m), 0).toISOString().split('T')[0];

                // For created_at we need to handle full timestamp if it stores time
                // Supabase filters usually handle date string comparison well for timestamps
                if (filterDateCol === 'created_at') {
                    query = query.gte(filterDateCol, `${start}T00:00:00`).lte(filterDateCol, `${end}T23:59:59`);
                } else {
                    query = query.gte(filterDateCol, start).lte(filterDateCol, end);
                }
            }

            if (categoryId) query = query.eq('category_id', categoryId);
            if (unitId) query = query.eq('unit_id', unitId);

            const { data, error } = await query;
            if (error) throw error;

            // Process Data
            const byCategory: any = {};
            const bySupplier: any = {};
            const byUnit: any = {};
            const byStatus = { paid: 0, pending: 0, overdue: 0 };
            const today = new Date().toISOString().split('T')[0];

            data?.forEach((p: any) => {
                const amount = Number(p.amount);
                const cat = (p.expense_categories as any)?.name || 'Sem Categoria';
                const sup = (p.suppliers as any)?.name || 'Sem Fornecedor';
                const unit = (p.units as any)?.name || 'Sem Unidade';

                byCategory[cat] = (byCategory[cat] || 0) + amount;
                bySupplier[sup] = (bySupplier[sup] || 0) + amount;
                byUnit[unit] = (byUnit[unit] || 0) + amount;

                if (p.payment_date) {
                    byStatus.paid += amount;
                } else {
                    byStatus.pending += amount;
                    if (p.due_date < today) {
                        byStatus.overdue += amount;
                    }
                }
            });

            // Convert to array format for charts
            const formatForChart = (obj: any) => Object.entries(obj).map(([name, value]) => ({ name, value }));

            res.json({
                byCategory: formatForChart(byCategory),
                bySupplier: formatForChart(bySupplier),
                byUnit: formatForChart(byUnit),
                byStatus,
                total: data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
            });

        } catch (err: any) {
            console.error('Report error:', err);
            res.status(500).json({ error: 'Failed to generate report' });
        }
    },

    async exportXls(req: AuthRequest, res: Response) {
        try {
            const context = await getUserContext(req.user.id);
            if (!context) return res.status(403).json({ error: 'User context not found' });

            const { startDate, endDate, month, categoryId, unitId, companyId, dateType } = req.query;
            const filterDateCol = (dateType === 'created_at') ? 'created_at' : 'due_date';

            let query = supabaseAdmin
                .from('accounts_payable')
                .select(`
                    amount,
                    due_date,
                    created_at,
                    payment_date,
                    document_number,
                    notes,
                    suppliers (name),
                    expense_categories!inner (id, name),
                    units!inner (id, name),
                    companies!inner (id, name)
                `);

            if (!context.company_id) return res.json([]);
            query = query.eq('company_id', context.company_id);

            if (startDate) query = query.gte(filterDateCol, startDate);
            if (endDate) query = query.lte(filterDateCol, endDate);

            if (month) {
                const start = `${month}-01`;
                const [y, m] = (month as string).split('-');
                const end = new Date(Number(y), Number(m), 0).toISOString().split('T')[0];
                if (filterDateCol === 'created_at') {
                    query = query.gte(filterDateCol, `${start}T00:00:00`).lte(filterDateCol, `${end}T23:59:59`);
                } else {
                    query = query.gte(filterDateCol, start).lte(filterDateCol, end);
                }
            }

            if (categoryId) query = query.eq('category_id', categoryId);
            if (unitId) query = query.eq('unit_id', unitId);

            const { data, error } = await query.order(filterDateCol, { ascending: true });
            if (error) throw error;

            // Transform data for Excel
            const rows = data?.map((p: any) => ({
                'Fornecedor': p.suppliers?.name || 'N/A',
                'Categoria': p.expense_categories?.name || 'N/A',
                'Unidade': p.units?.name || 'N/A',
                'Valor': Number(p.amount),
                'Vencimento': new Date(p.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                'Data Pagamento': p.payment_date ? new Date(p.payment_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
                'Status': p.payment_date ? 'Pago' : (new Date(p.due_date) < new Date() ? 'Vencido' : 'Aberto'),
                'Documento': p.document_number || '',
                'Notas': p.notes || ''
            }));

            // Generate Excel
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(rows || []);
            xlsx.utils.book_append_sheet(wb, ws, "Relatorio");

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_financeiro.xlsx');
            res.send(buffer);

        } catch (err: any) {
            console.error('Export error:', err);
            res.status(500).json({ error: 'Failed to export report' });
        }
    }
};
