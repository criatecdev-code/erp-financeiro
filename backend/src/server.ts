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
import { startAlertService } from './services/alert.service';
startAlertService();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
