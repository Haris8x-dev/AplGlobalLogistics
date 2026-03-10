import express from 'express';


import { generateUser } from '../../controllers/auth/authGenUser.controller.js';
import { loginAdmin } from '../../controllers/auth/authLoginAdmin.controller.js';
import { loginEmployee } from '../../controllers/auth/authLoginEmp.controller.js';
import { logoutUser } from '../../controllers/auth/authLogoutUser.controller.js';
import { getAuth } from '../../controllers/auth/authGetAuth.controller.js';
import { toggleUserStatus } from '../../controllers/auth/authUserStatus.controller.js';
import { updateUser } from '../../controllers/auth/authUpdateUser.controller.js';
import { updateUserRole } from '../../controllers/auth/authUpdateUserRole.controller.js';
import { verifyUser } from '../../controllers/auth/authVerifyUser.controller.js';
import { isAdmin, isUserActive, verifyToken } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// PROTECTED: Only an existing Admin can create new users
router.post('/generate', isAdmin, generateUser);
// PROTECTED: Only Admins can view the user lists
router.get('/getAuth', isAdmin, getAuth);

// PUBLIC: Separate login routes for Admin and Employee
router.post('/login/admin', loginAdmin);
router.post('/login/employee', loginEmployee);
// Both Employees and Admins can logout
router.post('/logout', logoutUser);

// PROTECTED: Verify user authentication and role
router.get('/verify', verifyToken, verifyUser);

// URL: /api/auth/status/:id
router.patch('/status/:id', isAdmin, isUserActive, toggleUserStatus);

// URL: PATCH /api/auth/update/:id
router.patch('/update/:id', isAdmin, isUserActive, updateUser);

// URL: PATCH /api/auth/update-role/:id
router.patch('/update-role/:id', isAdmin, isUserActive, updateUserRole);

export default router;