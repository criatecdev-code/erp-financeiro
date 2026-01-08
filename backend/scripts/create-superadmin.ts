import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega .env da pasta backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo backend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperadmin() {
    const email = process.argv[2] || 'admin@plataforma.com';
    const password = process.argv[3] || 'admin123456';
    const name = 'Super Admin';

    console.log(`🚀 Criando Superadmin: ${email}...`);

    let userId;

    // 1. Criar ou Buscar Usuário na Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('⚠️ Usuário já existe no Auth. Buscando ID...');
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existingUser = listData.users.find(u => u.email === email);
            if (!existingUser) {
                console.error('❌ Não foi possível encontrar o usuário existente.');
                return;
            }
            userId = existingUser.id;
        } else {
            console.error('❌ Erro no Auth:', authError.message);
            return;
        }
    } else {
        userId = authData.user.id;
        console.log(`✅ Usuário Auth criado! ID: ${userId}`);
    }

    // 2. Inserir ou Atualizar na tabela public.users
    const { error: dbError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            company_id: null,
            name,
            role: 'superadmin'
        });

    if (dbError) {
        console.error('❌ Erro no Banco:', dbError.message);
    } else {
        console.log('✅ Superadmin registrado no banco com sucesso!');
        console.log(`\n👉 Login: ${email}`);
        console.log(`👉 Senha: ${password}`);
    }
}

createSuperadmin();
