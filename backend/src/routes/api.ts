import { Router } from 'express';
import { SupplierController } from '../controllers/suppliers.controller';
import { PayableController } from '../controllers/payables.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

import { TenantController } from '../controllers/tenants.controller';
import { CategoryController } from '../controllers/categories.controller';
import { UnitController } from '../controllers/units.controller';
import { UserController } from '../controllers/users.controller';
import { ReportController } from '../controllers/reports.controller';
import { PlanController } from '../controllers/plans.controller';
import { EmailService } from '../services/alert.service';

// Test Route
router.get('/test-alert', async (req, res) => {
    await EmailService.sendOverdueAlert('teste@exemplo.com', 'Conta Teste (Energia)', 150.50, new Date().toISOString());
    res.json({ message: 'Teste enviado! Verifique o console do backend ou o email.' });
});

// Suppliers
router.get('/suppliers', authenticate, SupplierController.list);
router.post('/suppliers', authenticate, SupplierController.create);
router.put('/suppliers/:id', authenticate, SupplierController.update);
router.delete('/suppliers/:id', authenticate, SupplierController.delete);

// Categories
router.get('/categories', authenticate, CategoryController.list);
router.post('/categories', authenticate, CategoryController.create);
router.put('/categories/:id', authenticate, CategoryController.update);
router.delete('/categories/:id', authenticate, CategoryController.delete);

// Units
router.get('/units', authenticate, UnitController.list);
router.post('/units', authenticate, UnitController.create);
router.put('/units/:id', authenticate, UnitController.update);
router.delete('/units/:id', authenticate, UnitController.delete);

// Users (Tenant Context)
router.get('/users/me', authenticate, UserController.me);
router.get('/users', authenticate, UserController.list);
router.post('/users', authenticate, UserController.create);
router.put('/users/:id', authenticate, UserController.update);
router.delete('/users/:id', authenticate, UserController.delete);

// Payables
router.get('/payables', authenticate, PayableController.list);
router.post('/payables', authenticate, PayableController.create);
router.patch('/payables/:id/pay', authenticate, PayableController.pay);
router.put('/payables/:id', authenticate, PayableController.update);
router.delete('/payables/:id', authenticate, PayableController.delete);
router.get('/payables/stats', authenticate, PayableController.dashboardStats);

// Reports
router.get('/reports/summary', authenticate, ReportController.payablesSummary);
router.get('/reports/dashboard-details', authenticate, ReportController.dashboardDetailedStats);
router.get('/reports/export', authenticate, ReportController.exportXls);

// Tenants (Superadmin)
router.get('/tenants', authenticate, TenantController.list);
router.post('/tenants', authenticate, TenantController.create);
router.put('/tenants/:id', authenticate, TenantController.update);
router.delete('/tenants/:id', authenticate, TenantController.delete);
router.post('/tenants/link-user', authenticate, TenantController.linkUser);

// Plans (Superadmin)
router.get('/plans', PlanController.list); // Public GET for landing page
router.post('/plans', authenticate, PlanController.create);
router.put('/plans/:id', authenticate, PlanController.update);
router.delete('/plans/:id', authenticate, PlanController.delete);

export default router;
