import express from 'express';
import { generateUser, loginUser, logoutUser, getAuth, toggleUserStatus } from '../../controllers/auth/authController.js';
import { isAdmin, isUserActive } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// PROTECTED: Only an existing Admin can create new users
router.post('/generate', isAdmin, generateUser);
// PROTECTED: Only Admins can view the user lists
router.get('/getAuth', isAdmin, getAuth);

// PUBLIC: Anyone can attempt to login if they have credentials, but we will check if they are active in the loginUser controller
router.post('/login', isUserActive, loginUser);
// Both Employees and Admins can logout
router.post('/logout', logoutUser);

// URL: /api/auth/status/:id
router.patch('/status/:id', isAdmin, isUserActive, toggleUserStatus);

export default router;