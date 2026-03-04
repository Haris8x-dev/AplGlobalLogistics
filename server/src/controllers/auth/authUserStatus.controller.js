import prisma from '../../config/db.js';

// user status toggle - This will allow Admins to activate or deactivate user accounts without deleting them, providing better control over user access.
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId; // The person making the request

        // Prevent self-deactivation
        if (id === adminId) {
            return res.status(400).json({ message: "You cannot deactivate your own account!" });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive }
        });

        res.status(200).json({
            message: `User ${updatedUser.fullName} is now ${updatedUser.isActive ? 'Active' : 'Inactive'}`
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling user status" });
    }
};