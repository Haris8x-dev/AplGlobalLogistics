import express from 'express';
import { addInitialStock } from '../../controllers/stock/addStock.controller.js';
import { transferStock } from '../../controllers/stock/transferStock.controller.js';
import { getMasterInventory, getClientInventory } from '../../controllers/stock/masterInventory.controller.js';
import { getClientStockHistory, getRecentMovements } from '../../controllers/stock/clientStockHistory.controller.js';
import { getClientsWithStock } from '../../controllers/stock/clientsWithStock.controller.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 🚀 All stock routes require a valid login cookie
router.use(verifyToken);

// 1. Initial Load (Baseline)
router.post('/add-initial', addInitialStock);

// 2. Transfer (The Double-Entry Logic)
router.post('/transfer', transferStock);

// 2.5 Get Clients With Stock (For Transfer Interface)
router.get('/clients-with-stock', getClientsWithStock);

// 3. Manager Dashboard (The Master Result)
router.get('/master-inventory', getMasterInventory);

// 3.5 Client-Specific Inventory
router.get('/client-inventory/:clientId', getClientInventory);

// 4. Client-Specific History (The Detailed Ledger)
router.get('/history/:clientId/:modelId', getClientStockHistory);

//` 5. Recent Activity Feed (The Real-Time Pulse)
router.get('/recent-activity', getRecentMovements);

export default router;