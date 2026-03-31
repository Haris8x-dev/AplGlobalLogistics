import express from 'express';

import { addClient } from '../../controllers/admin/clients/clientsAdd.controller.js';
import { getClients } from '../../controllers/admin/clients/clientsGet.controller.js';
import { toggleClientStatus } from '../../controllers/admin/clients/clientStatus.controller.js';
import { updateClient } from '../../controllers/admin/clients/clientsUpdate.controller.js';
import { isAdmin, isUserActive, verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// add new client
router.post('/add', isAdmin, addClient);

// get all clients (with optional query param to filter active clients)
router.get('/all', verifyToken, getClients);

// Patch route to toggle client status (active/inactive) instead of deleting
router.patch('/status/:id', isAdmin, toggleClientStatus); // Use PATCH for updates

// URL: PATCH /api/admin/clients/update/:id
router.patch('/update/:id', isAdmin, isUserActive, updateClient);

export default router;