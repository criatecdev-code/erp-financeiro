import { Resend } from 'resend';
import cron from 'node-cron';
import { supabaseAdmin } from '../server';
import { WhatsAppService } from './whatsapp.service';

let resend: Resend | null = null;

export const EmailService = {
    async sendOverdueAlert(email: string, accountName: string, amount: number, dueDate: string) {
        if (!resend) {
            resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Fallback to avoid crash if env missing during early init, but strict check below
        }

        try {
            if (!process.env.RESEND_API_KEY) {
                console.log(`[Simulação Email] Para: ${email} | Assunto: Vencimento ${accountName}`);
                return;
            }
            await resend.emails.send({
                from: 'ContaCerta <alertas@contacerta.com.br>',
                to: email,
                subject: `⚠️ Alerta de Vencimento: ${accountName}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #ef4444;">Conta Próxima do Vencimento</h2>
                        <p>Olá, identificamos uma conta que vence em breve ou já está vencida:</p>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Conta:</strong> ${accountName}</p>
                            <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
                            <p><strong>Vencimento:</strong> ${new Date(dueDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <p>Por favor, acesse o sistema para realizar o pagamento e evitar juros.</p>
                        <a href="${process.env.FRONTEND_URL}/payables" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Acessar Financeiro</a>
                    </div>
                `
            });
            console.log(`Email enviado para ${email}`);
        } catch (err) {
            console.error('Falha ao enviar e-mail:', err);
        }
    },

    async runDailyCheck() {
        console.log('--- Iniciando Verificação de Vencimentos (Email & WhatsApp) ---');

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        // Busca contas que vencem hoje ou amanhã e não estão pagas
        const { data: accounts, error } = await supabaseAdmin
            .from('accounts_payable')
            .select('*, companies(name, email)')
            .is('payment_date', null)
            .in('due_date', [today, tomorrow]);

        if (error) {
            console.error('Erro ao buscar vencimentos:', error);
            return;
        }

        if (!accounts) return;

        for (const acc of accounts) {
            // Busca usuários admins da empresa para notificar
            const { data: users } = await supabaseAdmin
                .from('users')
                .select('email, phone, name')
                .eq('company_id', acc.company_id)
                .eq('role', 'admin');

            if (users) {
                for (const user of users) {
                    await EmailService.sendOverdueAlert(
                        user.email,
                        acc.description || 'Conta sem descrição',
                        acc.amount,
                        acc.due_date
                    );

                    if (user.phone) {
                        const message = `*⚠️ Alerta de Vencimento - ContaCerta*\n\nOlá ${user.name || 'Admin'},\n\nIdentificamos uma conta próxima do vencimento:\n\n📌 *Conta:* ${acc.description || 'Conta sem descrição'}\n💰 *Valor:* R$ ${acc.amount.toFixed(2)}\n📅 *Vencimento:* ${new Date(acc.due_date).toLocaleDateString('pt-BR')}\n\nAcesse o sistema para regularizar: ${process.env.FRONTEND_URL}/payables`;
                        await WhatsAppService.sendMessage(user.phone, message);
                    }
                }
            }
        }

        console.log('--- Verificação de Vencimentos Finalizada ---');
    }
};

export const startAlertService = () => {
    // Scheduler: Roda todo dia às 08:00 AM
    // Scheduler: Roda todo dia às 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        await EmailService.runDailyCheck();
    }, {
        timezone: "America/Sao_Paulo"
    });
    console.log('Alert Service Started (08:00 AM Daily)');
};
