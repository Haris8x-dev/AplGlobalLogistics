import express from 'express';
import {
    addCategory,
    toggleCategoryStatus,
    addMobileModel,
    getActiveInventory,
    getAdminInventory,
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
// Use this for the Admin Management Page
router.get('/admin-inventory', isAdmin, isUserActive, getAdminInventory);

// Use this for Dropdowns/General Selection (Accessible to Employees too if needed)
router.get('/active-inventory', getActiveInventory);

// 4. Delete Mobile Model
// URL: DELETE /api/admin/inventory/model/:id
router.delete('/model/:id', isAdmin, isUserActive, deleteMobileModel);

export default router;