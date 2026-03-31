import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const extractToken = (req) => {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    return token;
};

const getJwtSecret = () => process.env.JWT_SECRET;

const getUserFromToken = async (token) => {
    const secret = getJwtSecret();

    if (!secret) {
        const err = new Error('JWT secret is not configured');
        err.code = 'JWT_SECRET_MISSING';
        throw err;
    }

    const decoded = jwt.verify(token, secret);
    const userId = decoded?.userId;

    if (!userId) {
        const err = new Error('Token payload is invalid');
        err.code = 'TOKEN_INVALID_PAYLOAD';
        throw err;
    }

    return prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isActive: true }
    });
};

// Check isAdmin middleware to protect admin routes
export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            const token = extractToken(req);
            if (!token) {
                return res.status(401).json({ message: 'No token, authorization denied' });
            }

            const user = await getUserFromToken(token);

            if (!user || !user.isActive) {
                return res.status(401).json({ message: 'User is inactive or does not exist' });
            }

            req.user = user;
        }

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        next();
    } catch (error) {
        if (error.code === 'JWT_SECRET_MISSING') {
            return res.status(500).json({ message: 'Authentication service misconfigured' });
        }

        return res.status(401).json({ message: 'Token is not valid' });
    }
};

// Check if the user's account is active before allowing access to protected routes 
export const isUserActive = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: User info missing' });
        }

        if (req.user?.isActive === true) {
            return next();
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: 'Your account is deactivated. Please contact the Admin.'
            });
        }

        req.user = {
            ...req.user,
            id: userId,
            isActive: true,
        };

        next();
    } catch (error) {
        console.error('isUserActive Middleware Error:', error);
        res.status(500).json({ message: 'Error checking account status' });
    }
};

export const verifyToken = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const user = await getUserFromToken(token);

        if (!user) {
            return res.status(401).json({ message: 'User is inactive or does not exist' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'User is inactive or does not exist' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.code === 'JWT_SECRET_MISSING') {
            return res.status(500).json({ message: 'Authentication service misconfigured' });
        }

        console.error('JWT Verification Error:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};