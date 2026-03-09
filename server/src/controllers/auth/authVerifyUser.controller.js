import prisma from '../../config/db.js';

// Verify user authentication and return user info
export const verifyUser = async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isAdmin: true,
                isActive: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                isActive: user.isActive,
            }
        });

    } catch (error) {
        console.error("Verify Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
