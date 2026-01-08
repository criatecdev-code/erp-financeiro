const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    try {
        const { data: authUsers, error: ae } = await s.auth.admin.listUsers();
        if (ae) throw ae;
        const u = authUsers.users.find(x => x.email === 'admin@plataforma.com');
        if (!u) {
            console.log('User not found in auth');
            return;
        }
        console.log('Upserting user:', u.id);
        const { data, error } = await s.from('users').upsert({
            id: u.id,
            name: 'Super Admin',
            role: 'admin' // Use standard role first
        }).select();

        if (error) {
            console.error('Upsert Error:', error);
        } else {
            console.log('Upsert Success:', data);
        }
    } catch (err) {
        console.error('Run Error:', err);
    }
}
run();
