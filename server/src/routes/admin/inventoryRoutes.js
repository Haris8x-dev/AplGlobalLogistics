import express from 'express';

// category controllers
import { addCategory } from '../../controllers/admin/inventory/categories/invAddCat.controller.js';
import { getModelsByCategory } from '../../controllers/admin/inventory/categories/invGetModelsByCat.controller.js';
import { toggleCategoryStatus } from '../../controllers/admin/inventory/categories/invCatStatus.controller.js';
import { updateCategory } from '../../controllers/admin/inventory/categories/invUpdateCat.controller.js';
import { getAdminInventory } from '../../controllers/admin/inventory/categories/invGetAdminInventory.controller.js';
import { getActiveInventory } from '../../controllers/admin/inventory/categories/invGetActiveInventory.controller.js';


// mobile model controllers
import { addMobileModel } from '../../controllers/admin/inventory/mobiles/invAddMobile.controller.js';
import { deleteMobileModel } from '../../controllers/admin/inventory/mobiles/invDeleteMobile.controller.js';

// middlewares
import { isAdmin, isUserActive } from '../../middlewares/authMiddleware.js';

const router = express.Router();


// 1. Category Routes
router.post('/category', isAdmin, isUserActive, addCategory);
router.patch('/category/status/:id', isAdmin, isUserActive, toggleCategoryStatus);
router.patch('/category/:id', isAdmin, isUserActive, updateCategory);

// Fetch models by category for dropdowns
router.get('/category/:categoryId/models', getModelsByCategory);


// 2. Mobile Model Routes
router.post('/model', addMobileModel);

// 3. View Routes
// Use this for the Admin Management Page
router.get('/admin-inventory', isAdmin, isUserActive, getAdminInventory);

// Use this for Dropdowns/General Selection (Accessible to Employees too if needed)
router.get('/active-inventory', getActiveInventory);

// 4. Delete Mobile Model
// URL: DELETE /api/admin/inventory/model/:id
router.delete('/model/:id', isAdmin, isUserActive, deleteMobileModel);

export default router;