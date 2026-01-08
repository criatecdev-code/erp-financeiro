const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    features TEXT[] DEFAULT '{}',
    interval TEXT DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add plan_id to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
`;

async function run() {
    console.log('Running migration...');
    // Note: This requires the 'exec_sql' RPC or similar to be enabled, 
    // but in many cases we just use the REST API to check if we can.
    // However, since I can't easily run arbitrary SQL via the client without an RPC,
    // I will try to insert a dummy plan just to see if the table exists, 
    // or better, I'll advise the user to run the SQL in the editor.

    // Alternative: Use the provided SQL in the prompt for the user.
    console.log('--- PLEASE RUN THIS SQL IN SUPABASE EDITOR ---');
    console.log(sql);
}

run();
