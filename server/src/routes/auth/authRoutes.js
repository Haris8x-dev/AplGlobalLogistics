import express from 'express';
import { generateUser, loginUser } from '../../controllers/auth/authController.js';

const router = express.Router();

// The path will be: POST /api/auth/generate
router.post('/generate', generateUser);

// Route for everyone to login
router.post('/login', loginUser);

export default router;