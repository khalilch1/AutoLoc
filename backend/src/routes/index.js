const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const carsCtrl = require('../controllers/carsController');
const clientsCtrl = require('../controllers/clientsController');
const resCtrl = require('../controllers/reservationsController');
const {
  contractsGetAll, contractsCreate, contractsClose, contractPdf,
  invoicesGetAll, invoicesCreate, invoicesUpdate,
  paymentsGetAll, paymentsCreate,
  maintenanceGetAll, maintenanceCreate, maintenanceUpdate,
  dashboardStats, revenueReport
} = require('../controllers/mainController');

// Auth
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.get('/auth/me', auth, authCtrl.me);

// Dashboard
router.get('/dashboard/stats', auth, dashboardStats);
router.get('/reports/revenue', auth, revenueReport);

// Cars
router.get('/cars', auth, carsCtrl.getAll);
router.get('/cars/stats', auth, carsCtrl.getStats);
router.get('/cars/:id', auth, carsCtrl.getOne);
router.post('/cars', auth, carsCtrl.create);
router.put('/cars/:id', auth, carsCtrl.update);
router.delete('/cars/:id', auth, carsCtrl.remove);
router.post('/cars/:id/photo', auth, ...carsCtrl.uploadPhoto);
router.get('/cars/:id/photos', auth, carsCtrl.getPhotos);
router.post('/cars/:id/photos', auth, ...carsCtrl.addPhoto);
router.delete('/cars/:id/photos/:photoId', auth, carsCtrl.deletePhoto);
router.put('/cars/:id/photos/:photoId/primary', auth, carsCtrl.setPrimary);

// Clients
router.get('/clients', auth, clientsCtrl.getAll);
router.get('/clients/:id', auth, clientsCtrl.getOne);
router.post('/clients', auth, clientsCtrl.create);
router.put('/clients/:id', auth, clientsCtrl.update);
router.delete('/clients/:id', auth, clientsCtrl.remove);

// Reservations
router.get('/reservations', auth, resCtrl.getAll);
router.get('/reservations/availability', auth, resCtrl.checkAvailability);
router.get('/reservations/:id', auth, resCtrl.getOne);
router.post('/reservations', auth, resCtrl.create);
router.put('/reservations/:id', auth, resCtrl.update);
router.delete('/reservations/:id', auth, resCtrl.remove);

// Contracts
router.get('/contracts', auth, contractsGetAll);
router.post('/contracts', auth, contractsCreate);
router.put('/contracts/:id/close', auth, contractsClose);
router.get('/contracts/:id/pdf', auth, contractPdf);

// Invoices
router.get('/invoices', auth, invoicesGetAll);
router.post('/invoices', auth, invoicesCreate);
router.put('/invoices/:id', auth, invoicesUpdate);

// Payments
router.get('/payments', auth, paymentsGetAll);
router.post('/payments', auth, paymentsCreate);

// Maintenance
router.get('/maintenance', auth, maintenanceGetAll);
router.post('/maintenance', auth, maintenanceCreate);
router.put('/maintenance/:id', auth, maintenanceUpdate);

module.exports = router;
