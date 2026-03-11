import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';
import generateToken from '../../utils/generateToken.js';

// Employee Login - Only for employees, no admin secret code required
export const loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "User not found in the system" });
        }

        // 2. Check if the user is an Employee (not Admin)
        if (user.role === 'ADMIN') {
            return res.status(403).json({
                message: "Access denied: Admin users must use the Admin Login portal with a secret code."
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

        // 5. Generate Token and Set Cookie
        const token = generateToken(user.id, user.role);

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        // 6. ELECTRON SUPPORT: If request is from Electron, also send token in response body
        const isElectronClient = req.headers['x-client-type'] === 'electron';

        // DEBUG: Log the header detection
        console.log('🔍 [Backend Employee Login] Headers:', {
            'x-client-type': req.headers['x-client-type'],
            'user-agent': req.headers['user-agent']
        });
        console.log('🔍 [Backend Employee Login] Detected Electron:', isElectronClient);
        console.log('🔍 [Backend Employee Login] Sending token in response:', isElectronClient);

        res.status(200).json({
            message: "Success",
            role: user.role,
            // Only include token in response for Electron clients
            ...(isElectronClient && { token })
        });

    } catch (error) {
        console.error("Employee Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
