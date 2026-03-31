import express from "express";
import { createPassword, updatePassword, validatePassword } from "../../controllers/config/passwordProtect.controller.js";
import { validateLock } from "../../middlewares/validateLock.middleware.js";
import { isAdmin } from "../../middlewares/authMiddleware.js";

const router = express.Router();

const hasAuthToken = (req) => {
    if (req.cookies?.token) {
        return true;
    }

    const authHeader = req.headers.authorization;
    return typeof authHeader === "string" && authHeader.startsWith("Bearer ");
};

const allowAdminOrSetupKey = (req, res, next) => {
    const setupKey = process.env.APP_SETUP_KEY;
    const setupHeaderRaw = req.headers["x-setup-key"];
    const providedSetupKey = Array.isArray(setupHeaderRaw) ? setupHeaderRaw[0] : setupHeaderRaw;

    if (setupKey && providedSetupKey === setupKey) {
        return next();
    }

    if (providedSetupKey && !setupKey) {
        return res.status(503).json({
            success: false,
            message: "Server setup key is not configured"
        });
    }

    if (!setupKey && !hasAuthToken(req)) {
        return res.status(503).json({
            success: false,
            message: "Password bootstrap is disabled. Configure APP_SETUP_KEY or login as admin."
        });
    }

    return isAdmin(req, res, next);
};

// Create entry password (first-time setup)
router.post("/create-password", allowAdminOrSetupKey, createPassword);

// Update entry password
router.put("/update-password", isAdmin, updatePassword);

// Validate entry password (with middleware)
router.post("/validate-password", validateLock, validatePassword);

export default router;
