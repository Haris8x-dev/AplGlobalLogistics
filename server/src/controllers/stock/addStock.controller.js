import prisma from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const addInitialStock = async (req, res) => {
    try {
        const { modelId, clientId, quantity, transferType, message, jobNo, awb, movementDate } = req.body;
        const qty = parseInt(quantity);
        const activeUserId = req.user.id; // From verifyToken middleware

        // Validate required fields
        if (!modelId || !clientId || !quantity || !jobNo || !awb || !movementDate) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: modelId, clientId, quantity, jobNo, awb, or movementDate"
            });
        }

        // Check if user is admin - admins cannot add stock
        if (req.user.isAdmin === true) {
            return res.status(403).json({
                success: false,
                error: "Admins are not allowed to add stock. Only employees can perform this action."
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Generate unique transferGroupId for this stock addition
            const transferGroupId = uuidv4();

            // 1. Log the movement history
            const movement = await tx.stockMovement.create({
                data: {
                    quantity: qty,
                    transferType: transferType || "INITIAL_LOAD",
                    message,
                    jobNo,
                    awb,
                    movementDate: new Date(movementDate),
                    transferGroupId,
                    modelId,
                    clientId,
                    userId: activeUserId
                }
            });

            // 2. Initialize or Update the Master Balance
            const stock = await tx.clientStock.upsert({
                where: { clientId_modelId: { clientId, modelId } },
                update: {
                    currentBalance: { increment: qty },
                    lastMessage: message,
                    lastUpdatedBy: activeUserId
                },
                create: {
                    clientId,
                    modelId,
                    currentBalance: qty,
                    lastMessage: message,
                    lastUpdatedBy: activeUserId
                }
            });

            return { movement, stock };
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};