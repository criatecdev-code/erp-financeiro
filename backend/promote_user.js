const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    try {
        const { data: authUsers, error: ae } = await s.auth.admin.listUsers();
        if (ae) throw ae;
        const u = authUsers.users.find(x => x.email === 'admin@plataforma.com');
        if (!u) return;

        console.log('Upserting user as superadmin:', u.id);
        const { data, error } = await s.from('users').upsert({
            id: u.id,
            name: 'Super Admin',
            role: 'superadmin'
        }).select();

        if (error) {
            console.error('Upsert Error (Superadmin):', error);
        } else {
            console.log('Upsert Success (Superadmin):', data);
        }
    } catch (err) {
        console.error('Run Error:', err);
    }
}
run();
