import express from 'express';
import {
    addCategory,
    toggleCategoryStatus,
    addMobileModel,
    getAllInventory,
    deleteMobileModel
} from '../../controllers/admin/inventoryController.js';
import { isAdmin, isUserActive } from '../../middlewares/authMiddleware.js';

const router = express.Router();


// 1. Category Routes
router.post('/category', isAdmin, isUserActive, addCategory);
router.patch('/category/status/:id', isAdmin, isUserActive, toggleCategoryStatus);

// 2. Mobile Model Routes
router.post('/model', isAdmin, isUserActive, addMobileModel);

// 3. View Routes
router.get('/all', getAllInventory);

// URL: DELETE /api/admin/inventory/model/:id
router.delete('/model/:id', isAdmin, isUserActive, deleteMobileModel);

export default router;