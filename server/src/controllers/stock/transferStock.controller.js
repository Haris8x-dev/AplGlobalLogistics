import prisma from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const transferStock = async (req, res) => {
    try {
        const {
            fromClientId,
            toClientId,
            modelId,
            quantity,
            transferType,
            jobNo,
            movementDate,
            message: userMessage
        } = req.body;

        if (req.user.role === "ADMIN") {
            throw new HttpError(403, "Admins are not allowed to create transfer requests");
        }

        if (!fromClientId || !toClientId || !modelId || quantity === undefined || quantity === null || quantity === "") {
            throw new HttpError(400, "fromClientId, toClientId, modelId and quantity are required");
        }

        const qty = Number.parseInt(String(quantity), 10);
        const activeUserId = req.user.id;

        if (!Number.isInteger(qty) || qty <= 0) {
            throw new HttpError(400, "Quantity must be a positive integer");
        }

        if (!jobNo || !movementDate) {
            throw new HttpError(400, "jobNo and movementDate are required");
        }

        const parsedMovementDate = new Date(movementDate);
        if (Number.isNaN(parsedMovementDate.getTime())) {
            throw new HttpError(400, "Invalid movementDate");
        }

        if (fromClientId === toClientId) {
            throw new HttpError(400, "Cannot transfer to same client");
        }

        await prisma.$transaction(async (tx) => {

            const transferGroupId = uuidv4();

            // 1️⃣ Fetch clients
            const [fromClient, toClient] = await Promise.all([
                tx.client.findUnique({
                    where: { id: fromClientId },
                    select: { companyName: true }
                }),
                tx.client.findUnique({
                    where: { id: toClientId },
                    select: { companyName: true }
                })
            ]);

            if (!fromClient || !toClient) {
                throw new HttpError(400, "Invalid client(s)");
            }

            // 2️⃣ Check if model exists for source client
            const sourceStock = await tx.clientStock.findUnique({
                where: {
                    clientId_modelId: {
                        clientId: fromClientId,
                        modelId
                    }
                }
            });

            // 🔥 NEW: Model missing check
            if (!sourceStock) {
                throw new HttpError(400, `Model missing for ${fromClient.companyName}`);
            }

            // 🔥 NEW: Quantity check separated
            if (sourceStock.currentBalance < qty) {
                throw new HttpError(400,
                    `Insufficient stock at ${fromClient.companyName}`
                );
            }

            // 3️⃣ Prepare Messages
            const outMessage = `Transferred ${qty} to ${toClient.companyName}${userMessage ? " | " + userMessage : ""}`;

            const inMessage = `Received ${qty} from ${fromClient.companyName}${userMessage ? " | " + userMessage : ""}`;

            // ==========================
            // 🔴 DEDUCT FROM SOURCE (PENDING)
            // ==========================

            await tx.stockMovement.create({
                data: {
                    quantity: -qty,
                    transferType: transferType || "TransferOut",
                    message: outMessage,
                    jobNo,
                    status: "PENDING",    // 👈 NEW
                    movementDate: parsedMovementDate,
                    transferGroupId,
                    fromClientId,
                    toClientId,
                    modelId,
                    clientId: fromClientId,
                    userId: activeUserId
                }
            });

            // ❌ REMOVED ClientStock update (will run on proceed)

            // ==========================
            // 🟢 ADD TO DESTINATION (PENDING)
            // ==========================

            await tx.stockMovement.create({
                data: {
                    quantity: qty,
                    transferType: "TransferIn",
                    message: inMessage,
                    jobNo,
                    status: "PENDING",    // 👈 NEW
                    movementDate: parsedMovementDate,
                    transferGroupId,
                    fromClientId,
                    toClientId,
                    modelId,
                    clientId: toClientId,
                    userId: activeUserId
                }
            });

            // ❌ REMOVED ClientStock upsert (will run on proceed)

        });

        return res.status(200).json({
            success: true,
            message: "Transfer placed ON HOLD (Pending approval)"
        });

    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
        }

        console.error("Transfer request error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create transfer request",
        });
    }
};