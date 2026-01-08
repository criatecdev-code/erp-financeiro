import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import apiRoutes from './routes/api';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', apiRoutes);

// Supabase Admin Client (for background tasks/webhooks)
// For user requests, we should verify the JWT and use that context.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing in .env');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Basic Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'ERP Financeiro API',
    time: new Date().toISOString()
  });
});

// Initialize automated services
import { startAlertService, EmailService } from './services/alert.service';

// Cron Endpoint for Vercel
app.get('/api/cron', async (req, res) => {
  // Basic security check (configure CRON_SECRET in Vercel)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Running Cron Job via Endpoint...');
    // We can reuse the logic from alert service essentially looking for today's scans
    // But startAlertService uses node-cron. We need a one-off function.
    // Let's assume startAlertService defaults or we create a new one-off method.
    // For now, let's just trigger the one-off check logic if exposed, or just keep it simple.
    // Actually, we need to expose the logic inside EmailService/AlertService statically.

    // Assuming EmailService has a method logic. Based on previous view, it has sendOverdueAlert but creating the loop resides in Cron.
    // I will add a runCheck method to AlertService in next step. For now, just placeholder or direct call.
    await EmailService.runDailyCheck(); // We will create this method

    res.json({ success: true, message: 'Cron job executed' });
  } catch (error: any) {
    console.error('Cron job failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start Cron (Local Dev only)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  startAlertService();
}

// Export for Vercel
export default app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
