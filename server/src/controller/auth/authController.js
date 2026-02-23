import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


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


// User Login for both Employee and Admin - This will be used by both Employees and Admins to log in. Admins will have an extra step to verify their secret code.
export const loginUser = async (req, res) => {
    try {
        const { email, password, secretCode } = req.body;

        // 1. Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // 3. Admin-only Secret Check
        if (user.role === 'ADMIN') {
            if (!secretCode) return res.status(403).json({ message: "Admin Secret Code required" });

            const isSecretMatch = await bcrypt.compare(secretCode, user.secretCode);
            if (!isSecretMatch) return res.status(401).json({ message: "Invalid Admin Secret Code" });
        }

        // 4. Generate Token
        const secret = process.env.JWT_SECRET || "fallback_secret_key_123";
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            secret,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Success",
            token,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};