import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';

// To UPDATE user credentials - This will allow Admins to update user information such as name, email, phone number, password, role, and secret code (for Admins) without needing to delete and recreate accounts.
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phoneNumber, password } = req.body;

        // 1. Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Prepare data object for update
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        // 3. Hash password only if it's being changed
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // 4. Perform Update (Role and SecretCode are untouched)
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
                isActive: true
            }
        });

        res.status(200).json({
            message: "User identity updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Update User Error:", error);

        // Handle duplicate email error
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Email already in use by another account" });
        }

        res.status(500).json({ message: "Error updating user credentials" });
    }
};
