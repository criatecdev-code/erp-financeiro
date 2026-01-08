const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    try {
        const { data: auth, error: e1 } = await s.auth.admin.listUsers();
        const { data: pub, error: e2 } = await s.from('users').select('*');
        console.log('--- AUTH USERS ---');
        console.log(JSON.stringify(auth.users.map(u => ({ id: u.id, email: u.email })), null, 2));
        console.log('--- PUBLIC USERS ---');
        console.log(JSON.stringify(pub, null, 2));
    } catch (err) {
        console.error(err);
    }
}
run();
