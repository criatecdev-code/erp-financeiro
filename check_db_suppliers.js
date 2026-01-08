const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- UPDATING SUPPLIERS TABLE ---');

    // We can use the postgres endpoint directly if we had the password, 
    // but with the service role key we are limited to the API unless we have a custom RPC.

    // Let's try to update a record with these fields to see if they exist.
    const { error } = await s.from('suppliers').select('address, phone, email').limit(1);

    if (error && error.message.includes('column "address" does not exist')) {
        console.log('Columns missing. Please run the following SQL in your Supabase SQL Editor:');
        console.log(`
            ALTER TABLE suppliers ADD COLUMN address TEXT;
            ALTER TABLE suppliers ADD COLUMN phone TEXT;
            ALTER TABLE suppliers ADD COLUMN email TEXT;
        `);
    } else {
        console.log('Columns already exist or another error occurred:', error?.message);
    }
}
run();
