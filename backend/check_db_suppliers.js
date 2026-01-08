const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- UPDATING SUPPLIERS TABLE ---');

    // Check columns
    const { error } = await s.from('suppliers').select('address, phone, email').limit(1);

    if (error && error.message.includes('column "address" does not exist')) {
        console.log('Columns missing. Please run the following SQL in your Supabase SQL Editor:');
        console.log(`
            ALTER TABLE suppliers ADD COLUMN address TEXT;
            ALTER TABLE suppliers ADD COLUMN phone TEXT;
            ALTER TABLE suppliers ADD COLUMN email TEXT;
        `);
    } else if (error) {
        console.log('Error checking columns:', error.message);
    } else {
        console.log('Columns already exist.');
    }
}
run();
