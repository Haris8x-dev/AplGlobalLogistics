import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';
import generateToken from '../../utils/generateToken.js';

// Admin Login - Validates admin privileges and secret code
export const loginAdmin = async (req, res) => {
    try {
        const { email, password, secretCode } = req.body;

        // 1. Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "User not found in the system" });
        }

        // 2. Check if the user is an Admin
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                message: "Access denied: This portal is for administrators only. Please use the Employee Login portal."
            });
        }

        // 3. Check if the account is active
        if (!user.isActive) {
            return res.status(403).json({
                message: "Access denied: Your account is currently deactivated. Please contact an Admin."
            });
        }

        // 4. Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials | Password incorrect" });
        }

        // 5. Verify Admin Secret Code (Required for admin login)
        if (!secretCode) {
            return res.status(401).json({ message: "Admin Secret Code is required" });
        }

        const isSecretMatch = await bcrypt.compare(secretCode, user.secretCode || "");
        if (!isSecretMatch) {
            return res.status(401).json({ message: "Invalid Admin Secret Code" });
        }

        // 6. Generate Token and Set Cookie
        const token = generateToken(user.id, user.role);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        // 7. ELECTRON SUPPORT: If request is from Electron, also send token in response body
        const isElectronClient = req.headers['x-client-type'] === 'electron';

        res.status(200).json({
            message: "Success",
            role: user.role,
            // Only include token in response for Electron clients
            ...(isElectronClient && { token })
        });

    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
