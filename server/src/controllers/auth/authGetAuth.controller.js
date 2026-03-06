import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';

// Fetching User Lists for Admins - This will allow Admins to view a list of all users, categorized by their roles (Admins and Employees).
export const getAuth = async (req, res) => {
    try {
        // 1. Fetch all users, but only grab the fields we want to show
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        });

        // 2. Filter them into two separate arrays
        const admins = allUsers.filter(user => user.role === 'ADMIN');
        const employees = allUsers.filter(user => user.role === 'EMPLOYEE');

        // 3. Send the organized data
        res.status(200).json({
            success: true,
            totalUsers: allUsers.length,
            data: {
                admins,
                employees
            }
        });

    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({ message: "Server error while fetching users" });
    }
};
