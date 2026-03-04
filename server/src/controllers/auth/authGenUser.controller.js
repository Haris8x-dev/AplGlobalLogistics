import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';

// User Credential Generation for both Employee and Admin - This will be used by the Manager to create credentials for new employees and admins.
export const generateUser = async (req, res) => {
    try {
        // Destructure the data coming from the Postman request
        const { fullName, email, phoneNumber, password, role, secretCode } = req.body;

        // 1. Check if email already exists in Postgres
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Hash secretCode ONLY if user is an ADMIN
        let hashedSecret = null;
        if (role === 'ADMIN' && secretCode) {
            hashedSecret = await bcrypt.hash(secretCode, 10);
        }

        // 4. Create the user in the database
        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                phoneNumber,
                password: hashedPassword,
                role: role || 'EMPLOYEE', // Defaults to employee if not specified
                secretCode: hashedSecret,
            },
        });

        res.status(201).json({
            message: "Credentials generated and saved successfully",
            user: { id: newUser.id, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        console.error("Error generating user:", error);
        res.status(500).json({ message: "Database error" });
    }
};
