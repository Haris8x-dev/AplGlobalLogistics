import prisma from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const transferStock = async (req, res) => {
    try {
        const {
            fromClientId,
            toClientId,
            modelId,
            quantity,
            transferType,
            message: userMessage
        } = req.body;

        const qty = parseInt(quantity);
        const activeUserId = req.user.id;

        if (!qty || qty <= 0) {
            return res.status(400).json({ error: "Quantity must be greater than 0" });
        }

        if (fromClientId === toClientId) {
            return res.status(400).json({ error: "Cannot transfer to same client" });
        }

        await prisma.$transaction(async (tx) => {

            // 🔥 Generate one transfer group ID
            const transferGroupId = uuidv4();

            // 1️⃣ Fetch clients for readable logging
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
                throw new Error("Invalid client(s)");
            }

            // 2️⃣ Check Source Balance
            const sourceStock = await tx.clientStock.findUnique({
                where: {
                    clientId_modelId: {
                        clientId: fromClientId,
                        modelId
                    }
                }
            });

            if (!sourceStock || sourceStock.currentBalance < qty) {
                throw new Error(
                    `Insufficient stock at ${fromClient.companyName}`
                );
            }

            // 3️⃣ Prepare Messages
            const outMessage = `Transferred ${qty} to ${toClient.companyName}${userMessage ? " | " + userMessage : ""
                }`;

            const inMessage = `Received ${qty} from ${fromClient.companyName}${userMessage ? " | " + userMessage : ""
                }`;

            // ==========================
            // 🔴 DEDUCT FROM SOURCE
            // ==========================

            await tx.stockMovement.create({
                data: {
                    quantity: -qty,
                    transferType: transferType || "TransferOut",
                    message: outMessage,
                    transferGroupId,
                    fromClientId,
                    toClientId,
                    modelId,
                    clientId: fromClientId,
                    userId: activeUserId
                }
            });

            await tx.clientStock.update({
                where: {
                    clientId_modelId: {
                        clientId: fromClientId,
                        modelId
                    }
                },
                data: {
                    currentBalance: { decrement: qty },
                    lastMessage: outMessage,
                    lastUpdatedBy: activeUserId
                }
            });

            // ==========================
            // 🟢 ADD TO DESTINATION
            // ==========================

            await tx.stockMovement.create({
                data: {
                    quantity: qty,
                    transferType: "TransferIn",
                    message: inMessage,
                    transferGroupId,
                    fromClientId,
                    toClientId,
                    modelId,
                    clientId: toClientId,
                    userId: activeUserId
                }
            });

            await tx.clientStock.upsert({
                where: {
                    clientId_modelId: {
                        clientId: toClientId,
                        modelId
                    }
                },
                update: {
                    currentBalance: { increment: qty },
                    lastMessage: inMessage,
                    lastUpdatedBy: activeUserId
                },
                create: {
                    clientId: toClientId,
                    modelId,
                    currentBalance: qty,
                    lastMessage: inMessage,
                    lastUpdatedBy: activeUserId
                }
            });

        });

        return res.status(200).json({
            success: true,
            message: "Transfer completed successfully"
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};