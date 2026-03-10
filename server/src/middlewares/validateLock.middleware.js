import prisma from "../config/db.js";
import bcrypt from "bcryptjs";

// Middleware to validate entry password
export const validateLock = async (req, res, next) => {
    try {
        const { password } = req.body;

        // Check if password is provided
        if (!password || password.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        // Get the stored password from AppConfig
        const config = await prisma.appConfig.findUnique({
            where: { id: "GLOBAL_CONFIG" }
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Entry password not configured. Please set up the password first."
            });
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, config.entryPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        // Password is valid, proceed to next middleware/controller
        next();

    } catch (error) {
        console.error("❌ Error validating lock password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
