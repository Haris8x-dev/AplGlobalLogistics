import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';
import generateToken from '../../utils/generateToken.js';

// User Login for both Employee and Admin - This will be used by both Employees and Admins to log in. Admins will have an extra step to verify their secret code.
export const loginUser = async (req, res) => {
    try {
        const { email, password, secretCode } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        // 1. Check if user exists
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        // 2. NEW: Check if the account is active
        if (!user.isActive) {
            return res.status(403).json({
                message: "Access denied: Your account is currently deactivated. Please contact an Admin."
            });
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // 4. Admin Secret Code Check
        if (user.role === 'ADMIN') {
            const isSecretMatch = await bcrypt.compare(secretCode || "", user.secretCode || "");
            if (!isSecretMatch) return res.status(401).json({ message: "Invalid Admin Secret Code" });
        }

        // 5. Generate Token and Set Cookie
        const token = generateToken(user.id, user.role);

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "Success",
            role: user.role
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
