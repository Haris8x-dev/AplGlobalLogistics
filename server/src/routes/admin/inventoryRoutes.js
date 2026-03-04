import express from 'express';

import { addCategory } from '../../controllers/admin/inventory/invAddCat.controller.js';
import { toggleCategoryStatus } from '../../controllers/admin/inventory/invCatStatus.controller.js';
import { addMobileModel } from '../../controllers/admin/inventory/invAddMobile.controller.js';
import { getActiveInventory } from '../../controllers/admin/inventory/invGetActiveInventory.controller.js';
import { getAdminInventory } from '../../controllers/admin/inventory/invGetAdminInventory.controller.js';
import { deleteMobileModel } from '../../controllers/admin/inventory/invDeleteMobile.controller.js';
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