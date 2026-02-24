import prisma from '../../config/db.js';
import bcrypt from 'bcryptjs';
import generateToken from '../../utils/generateToken.js';

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
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(401).json({ message: "Invalid credentials" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        if (user.role === 'ADMIN') {
            const isSecretMatch = await bcrypt.compare(secretCode || "", user.secretCode || "");
            if (!isSecretMatch) return res.status(401).json({ message: "Invalid Admin Secret Code" });
        }

        const token = generateToken(user.id, user.role);

        // SENDING VIA HTTP-ONLY COOKIE
        res.cookie('token', token, {
            httpOnly: true,     // Block JavaScript access (No XSS)
            secure: false,      // Set to true in production (HTTPS)
            sameSite: 'lax',    // Helps with CSRF protection
            maxAge: 24 * 60 * 60 * 1000 // 1 Day
        });

        res.status(200).json({
            message: "Success",
            role: user.role
            // We don't strictly need to send the token in JSON anymore!
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};





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


// Logout User - This will allow both Employees and Admins to log out by clearing the authentication cookie.
export const logoutUser = async (req, res) => {
    try {
        // Clear the cookie by setting its expiration to the past
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0), // Sets expiration to 1970 (immediate expiry)
            sameSite: 'lax',
            secure: false // Set to true in production
        });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error during logout" });
    }
};
