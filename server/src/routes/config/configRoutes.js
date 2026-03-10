import express from "express";
import { createPassword, updatePassword, validatePassword } from "../../controllers/config/passwordProtect.controller.js";
import { validateLock } from "../../middlewares/validateLock.middleware.js";

const router = express.Router();

// Create entry password (first-time setup)
router.post("/create-password", createPassword);

// Update entry password
router.put("/update-password", updatePassword);

// Validate entry password (with middleware)
router.post("/validate-password", validateLock, validatePassword);

export default router;
