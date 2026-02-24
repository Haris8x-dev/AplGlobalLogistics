import jwt from 'jsonwebtoken';

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