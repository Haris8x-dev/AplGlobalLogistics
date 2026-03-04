import prisma  from "../../config/db.js";

export const transferStock = async (req, res) => {
    try {
        const { fromClientId, toClientId, modelId, quantity, transferType, message } = req.body;
        const qty = parseInt(quantity);
        const activeUserId = req.user.id;

        await prisma.$transaction(async (tx) => {
            // 1. Check if Client A has enough stock
            const sourceStock = await tx.clientStock.findUnique({
                where: { clientId_modelId: { clientId: fromClientId, modelId } }
            });

            if (!sourceStock || sourceStock.currentBalance < qty) {
                throw new Error(`Insufficient stock. Client has only ${sourceStock?.currentBalance || 0}`);
            }

            // 2. DEDUCT from Client A
            await tx.stockMovement.create({
                data: {
                    quantity: -qty,
                    transferType,
                    message: message || `Transferred to Client: ${toClientId}`,
                    modelId,
                    clientId: fromClientId,
                    userId: activeUserId
                }
            });
            await tx.clientStock.update({
                where: { clientId_modelId: { clientId: fromClientId, modelId } },
                data: {
                    currentBalance: { decrement: qty },
                    lastMessage: message,
                    lastUpdatedBy: activeUserId
                }
            });

            // 3. ADD to Client B
            await tx.stockMovement.create({
                data: {
                    quantity: qty,
                    transferType: transferType.includes("Out") ? transferType.replace("Out", "In") : "In",
                    message: message || `Received from Client: ${fromClientId}`,
                    modelId,
                    clientId: toClientId,
                    userId: activeUserId
                }
            });
            await tx.clientStock.upsert({
                where: { clientId_modelId: { clientId: toClientId, modelId } },
                update: {
                    currentBalance: { increment: qty },
                    lastMessage: message,
                    lastUpdatedBy: activeUserId
                },
                create: {
                    clientId: toClientId,
                    modelId,
                    currentBalance: qty,
                    lastMessage: message,
                    lastUpdatedBy: activeUserId
                }
            });
        });

        res.status(200).json({ success: true, message: "Transfer successful and balance updated." });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};