import express from 'express';
import { addClient, getClients, toggleClientStatus, updateClient } from '../../controllers/admin/clientController.js';
import { isAdmin, isUserActive } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// add new client
router.post('/add', isAdmin, addClient);

// get all clients (with optional query param to filter active clients)
router.get('/all', isAdmin, getClients);

// Patch route to toggle client status (active/inactive) instead of deleting
router.patch('/status/:id', isAdmin, toggleClientStatus); // Use PATCH for updates

// URL: PATCH /api/admin/clients/update/:id
router.patch('/update/:id', isAdmin, isUserActive, updateClient);

export default router;