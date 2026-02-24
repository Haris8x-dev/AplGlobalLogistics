import express from 'express';
import { generateUser, loginUser, logoutUser, getAuth } from '../../controllers/auth/authController.js';
import { isAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// PROTECTED: Only an existing Admin can create new users
router.post('/generate', isAdmin, generateUser);
// PROTECTED: Only Admins can view the user lists
router.get('/getAuth', isAdmin, getAuth);

// PUBLIC: Anyone can attempt to login
router.post('/login', loginUser);
// Both Employees and Admins can logout
router.post('/logout', logoutUser);
    
export default router;