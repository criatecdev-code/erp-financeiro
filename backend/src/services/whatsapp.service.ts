import axios from 'axios';

export const WhatsAppService = {
    async sendMessage(phone: string, message: string) {
        // Formata o número (remove caracteres não numéricos e garante o código do país)
        const cleanPhone = phone.replace(/\D/g, '');
        const targetPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

        try {
            // Exemplo para Evolution API ou similar
            // Se o usuário não tiver uma API configurada, apenas logamos no console para não quebrar o fluxo
            if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) {
                console.log('--- SIMULAÇÃO WHATSAPP ---');
                console.log(`Para: ${targetPhone}`);
                console.log(`Mensagem: ${message}`);
                console.log('---------------------------');
                return;
            }

            await axios.post(`${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE}`, {
                number: targetPhone,
                text: message,
                delay: 1200,
                linkPreview: true
            }, {
                headers: {
                    'apikey': process.env.WHATSAPP_API_KEY
                }
            });

            console.log(`WhatsApp enviado para ${targetPhone}`);
        } catch (err) {
            console.error('Falha ao enviar WhatsApp:', err);
        }
    }
};
