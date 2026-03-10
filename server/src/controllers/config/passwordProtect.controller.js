import prisma from "../../config/db.js";
import bcrypt from "bcryptjs";


// Create Entry Password (First Time Setup)
export const createPassword = async (req, res) => {
    try {
        const { password } = req.body;

        // Validation
        if (!password || password.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Check if password already exists
        const existingConfig = await prisma.appConfig.findUnique({
            where: { id: "GLOBAL_CONFIG" }
        });

        if (existingConfig) {
            return res.status(400).json({
                success: false,
                message: "Entry password already exists. Use update endpoint to change it."
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the AppConfig record
        const config = await prisma.appConfig.create({
            data: {
                id: "GLOBAL_CONFIG",
                entryPassword: hashedPassword
            }
        });

        return res.status(201).json({
            success: true,
            message: "Entry password created successfully",
            data: {
                id: config.id,
                updatedAt: config.updatedAt
            }
        });

    } catch (error) {
        console.error("❌ Error creating entry password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update Entry Password
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Both current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        // Check if config exists
        const config = await prisma.appConfig.findUnique({
            where: { id: "GLOBAL_CONFIG" }
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Entry password not set. Please create it first."
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, config.entryPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        const updatedConfig = await prisma.appConfig.update({
            where: { id: "GLOBAL_CONFIG" },
            data: {
                entryPassword: hashedNewPassword
            }
        });

        return res.status(200).json({
            success: true,
            message: "Entry password updated successfully",
            data: {
                id: updatedConfig.id,
                updatedAt: updatedConfig.updatedAt
            }
        });

    } catch (error) {
        console.error("❌ Error updating entry password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Validate Entry Password
export const validatePassword = async (req, res) => {
    try {
        // If middleware passed, password is valid
        return res.status(200).json({
            success: true,
            message: "Password is valid",
            isValid: true
        });

    } catch (error) {
        console.error("❌ Error validating entry password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
