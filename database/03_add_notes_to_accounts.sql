-- Add notes column to accounts_payable if it doesn't exist
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS notes TEXT;
