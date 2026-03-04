import express from 'express';
import { addInitialStock } from '../../controllers/stock/addStock.controller.js';
import { transferStock } from '../../controllers/stock/transferStock.controller.js';
import { getMasterInventory } from '../../controllers/stock/masterInventory.controller.js';
import { getClientStockHistory } from '../../controllers/stock/clientStockHistory.controller.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 🚀 All stock routes require a valid login cookie
router.use(verifyToken);

// 1. Initial Load (Baseline)
router.post('/add-initial', addInitialStock);

// 2. Transfer (The Double-Entry Logic)
router.post('/transfer', transferStock);

// 3. Manager Dashboard (The Master Result)
router.get('/master-inventory', getMasterInventory);

// 4. Client-Specific History (The Detailed Ledger)
router.get('/history/:clientId/:modelId', getClientStockHistory);

export default router;