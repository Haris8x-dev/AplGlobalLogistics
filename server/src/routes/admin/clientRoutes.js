import express from 'express';
import { addClient, getClients, toggleClientStatus } from '../../controllers/admin/clientController.js';
import { isAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/add', isAdmin, addClient);
router.get('/all', isAdmin, getClients);
router.patch('/status/:id', isAdmin, toggleClientStatus); // Use PATCH for updates

export default router;