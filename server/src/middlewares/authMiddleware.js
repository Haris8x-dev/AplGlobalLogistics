import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

// Check isAdmin middleware to protect admin routes
export const isAdmin = (req, res, next) => {
    // Look for the token in the cookies
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const secret = process.env.JWT_SECRET || "fallback_secret_key_123";
        const decoded = jwt.verify(token, secret);
        req.user = decoded;

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

// Check if the user's account is active before allowing access to protected routes 
export const isUserActive = async (req, res, next) => {
    try {
        // 1. Ensure req.user exists (set by a previous token check)
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Unauthorized: User info missing" });
        }

        const userId = req.user.userId;

        // 2. Query the DB
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User account not found" });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account is deactivated. Please contact the Admin."
            });
        }

        next();
    } catch (error) {
        // Log the error to your terminal so you can see exactly why it failed
        console.error("isUserActive Middleware Error:", error);
        res.status(500).json({ message: "Error checking account status" });
    }
};