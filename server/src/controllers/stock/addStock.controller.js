import prisma from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const addInitialStock = async (req, res) => {
    try {
        const { modelId, clientId, quantity, transferType, message, jobNo, awb, movementDate } = req.body;
        const qty = Number.parseInt(String(quantity), 10);
        const activeUserId = req.user.id; // From verifyToken middleware

        // Validate required fields
        if (!modelId || !clientId || !quantity || !jobNo || !awb || !movementDate) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: modelId, clientId, quantity, jobNo, awb, or movementDate"
            });
        }

        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: "Quantity must be a positive integer"
            });
        }

        const parsedMovementDate = new Date(movementDate);
        if (Number.isNaN(parsedMovementDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: "Invalid movementDate"
            });
        }

        // Check if user is admin - admins cannot add stock
        if (req.user.role === "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Admins are not allowed to add stock. Only employees can perform this action."
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Generate unique transferGroupId for this stock addition
            const transferGroupId = uuidv4();

            // 1. Log the movement history as PENDING
            const movement = await tx.stockMovement.create({
                data: {
                    quantity: qty,
                    transferType: transferType || "INITIAL_LOAD",
                    message,
                    jobNo,
                    awb,
                    movementDate: parsedMovementDate,
                    status: "PENDING", // <--- Save as pending
                    transferGroupId,
                    modelId,
                    clientId,
                    userId: activeUserId
                }
            });

            // 2. Ensure ClientStock exists so the model appears in UI for the admin to approve.
            // We DO NOT update currentBalance; we just make sure a row exists.
            await tx.clientStock.upsert({
                where: {
                    clientId_modelId: { clientId, modelId }
                },
                update: {}, // No change to balance here
                create: {
                    client: { connect: { id: clientId } },
                    model: { connect: { id: modelId } },
                    currentBalance: 0, // Starts at 0, only increases on Proceed
                    user: { connect: { id: activeUserId } }
                }
            });

            return { movement };
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error("Error adding initial stock:", error);
        res.status(500).json({ success: false, error: "Failed to add stock" });
    }
};