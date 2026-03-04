import prisma  from "../../config/db.js";

export const addInitialStock = async (req, res) => {
    try {
        const { modelId, clientId, quantity, transferType, message } = req.body;
        const qty = parseInt(quantity);
        const activeUserId = req.user.id; // From verifyToken middleware

        const result = await prisma.$transaction(async (tx) => {
            // 1. Log the movement history
            const movement = await tx.stockMovement.create({
                data: {
                    quantity: qty,
                    transferType: transferType || "In",
                    message, // String entry
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