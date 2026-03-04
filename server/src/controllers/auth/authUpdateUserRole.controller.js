import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';


// USER ROLE + SECRET CODE UPDATION - This handles the Role Reversal & Secret Code Reset
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, secretCode } = req.body;

        // 1. Safety: Admin cannot demote themselves
        if (id === req.user.userId) {
            return res.status(400).json({ message: "You cannot change your own rank!" });
        }

        const updateData = { role };

        // 2. THE REVERT LOGIC
        if (role === 'ADMIN') {
            // Re-promoting: Must provide a new secret code
            if (!secretCode) {
                return res.status(400).json({ message: "Secret code is required to promote to Admin" });
            }
            updateData.secretCode = await bcrypt.hash(secretCode, 10);
        } else {
            // Reverting to Employee: Wipe the secret code
            updateData.secretCode = null;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, fullName: true, role: true }
        });

        res.status(200).json({
            message: `User rank successfully changed to ${role}. ${role === 'EMPLOYEE' ? 'Secret code cleared.' : 'New secret code set.'}`,
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({ message: "Error updating user rank" });
    }
};

