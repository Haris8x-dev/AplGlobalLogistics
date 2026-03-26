import prisma from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Revert a TRANSFER entry (paired rows: one negative, one positive)
export const revertTransferStock = async (req, res) => {
    try {
        const { transferGroupId } = req.params;
        const { reason } = req.body;

        if (!transferGroupId) {
            return res.status(400).json({ success: false, error: "transferGroupId is required" });
        }

        if (!reason || !String(reason).trim()) {
            return res.status(400).json({ success: false, error: "Reason is required to revert a transfer" });
        }

        if (req.user?.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Only admins can revert transfers"
            });
        }

        const originalRows = await prisma.stockMovement.findMany({
            where: { transferGroupId },
            orderBy: { createdAt: "asc" }
        });

        if (originalRows.length < 2) {
            return res.status(404).json({
                success: false,
                error: "Transfer group not found or incomplete"
            });
        }

        const alreadyReverted = await prisma.stockMovement.findFirst({
            where: {
                transferType: "REVERSAL",
                message: {
                    contains: `[REVERSAL_OF_GROUP:${transferGroupId}]`
                }
            },
            select: { id: true }
        });

        if (alreadyReverted) {
            return res.status(409).json({
                success: false,
                error: "This transfer is already reverted"
            });
        }

        const outRow = originalRows.find((row) => row.quantity < 0);
        const inRow = originalRows.find((row) => row.quantity > 0);

        if (!outRow || !inRow) {
            return res.status(400).json({
                success: false,
                error: "Invalid transfer pair. Expected one outgoing and one incoming row"
            });
        }

        if (outRow.modelId !== inRow.modelId) {
            return res.status(400).json({
                success: false,
                error: "Invalid transfer pair. Model mismatch"
            });
        }

        const qty = Math.abs(outRow.quantity);
        if (qty !== Math.abs(inRow.quantity)) {
            return res.status(400).json({
                success: false,
                error: "Invalid transfer pair. Quantity mismatch"
            });
        }

        const destinationStock = await prisma.clientStock.findUnique({
            where: {
                clientId_modelId: {
                    clientId: inRow.clientId,
                    modelId: inRow.modelId
                }
            },
            select: { currentBalance: true }
        });

        if (!destinationStock || destinationStock.currentBalance < qty) {
            return res.status(400).json({
                success: false,
                error: "Revert blocked: destination does not have enough stock to roll back"
            });
        }

        const activeUserId = req.user.id;
        const reversalGroupId = uuidv4();
        const reversalReason = String(reason).trim();
        const reversalMessage = `[REVERSAL_OF_GROUP:${transferGroupId}] ${reversalReason}`;

        await prisma.$transaction(async (tx) => {
            // Reversal for the destination client (decrease their balance)
            await tx.stockMovement.create({
                data: {
                    quantity: qty,
                    transferType: "REVERSAL",
                    message: reversalMessage,
                    jobNo: `REV-${outRow.jobNo || transferGroupId.slice(0, 8)}`,
                    awb: outRow.awb || null,
                    movementDate: new Date(),
                    transferGroupId: reversalGroupId,
                    fromClientId: inRow.clientId,
                    toClientId: outRow.clientId,
                    modelId: outRow.modelId,
                    clientId: outRow.clientId,
                    userId: activeUserId
                }
            });

            await tx.clientStock.update({
                where: {
                    clientId_modelId: {
                        clientId: outRow.clientId,
                        modelId: outRow.modelId
                    }
                },
                data: {
                    currentBalance: { increment: qty },
                    lastMessage: reversalMessage,
                    lastUpdatedBy: activeUserId
                }
            });

            // Reversal for the source client (increase their balance)
            await tx.stockMovement.create({
                data: {
                    quantity: -qty,
                    transferType: "REVERSAL",
                    message: reversalMessage,
                    jobNo: `REV-${outRow.jobNo || transferGroupId.slice(0, 8)}`,
                    awb: inRow.awb || null,
                    movementDate: new Date(),
                    transferGroupId: reversalGroupId,
                    fromClientId: inRow.clientId,
                    toClientId: outRow.clientId,
                    modelId: inRow.modelId,
                    clientId: inRow.clientId,
                    userId: activeUserId
                }
            });

            await tx.clientStock.update({
                where: {
                    clientId_modelId: {
                        clientId: inRow.clientId,
                        modelId: inRow.modelId
                    }
                },
                data: {
                    currentBalance: { decrement: qty },
                    lastMessage: reversalMessage,
                    lastUpdatedBy: activeUserId
                }
            });
        });

        return res.status(200).json({
            success: true,
            message: "Transfer reverted successfully",
            data: {
                originalTransferGroupId: transferGroupId,
                reversalTransferGroupId: reversalGroupId
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to revert transfer"
        });
    }
};

// Revert an ADD STOCK entry (single row with positive quantity)
export const revertAddedStock = async (req, res) => {
    try {
        const { transferGroupId } = req.params;
        const { reason } = req.body;

        if (!transferGroupId) {
            return res.status(400).json({ success: false, error: "transferGroupId is required" });
        }

        if (!reason || !String(reason).trim()) {
            return res.status(400).json({ success: false, error: "Reason is required to delete stock addition" });
        }

        if (req.user?.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Only admins can revert stock additions"
            });
        }

        // Find the original add stock entry
        const originalEntry = await prisma.stockMovement.findFirst({
            where: {
                OR: [
                    { transferGroupId: transferGroupId },
                    { id: transferGroupId }
                ]
            },
            orderBy: { createdAt: "asc" }
        });

        if (!originalEntry) {
            return res.status(404).json({
                success: false,
                error: "Stock entry not found"
            });
        }

        if (originalEntry.quantity <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid entry. Expected a single positive quantity row"
            });
        }

        const clientStock = await prisma.clientStock.findUnique({
            where: {
                clientId_modelId: {
                    clientId: originalEntry.clientId,
                    modelId: originalEntry.modelId
                }
            },
            select: { currentBalance: true }
        });

        // Ensure that the current balance has not dipped below the quantity of this addition.
        // If it has, it means some of this stock was already moved and cannot be deleted.
        if (!clientStock || clientStock.currentBalance < originalEntry.quantity) {
            return res.status(400).json({
                success: false,
                error: "Cannot delete: This stock has already been transferred to another client."
            });
        }

        const activeUserId = req.user.id;
        const qty = originalEntry.quantity;

        await prisma.$transaction(async (tx) => {
            // Completely delete the original stock movement entry
            await tx.stockMovement.delete({
                where: { id: originalEntry.id }
            });

            // Decrease the client's balance
            await tx.clientStock.update({
                where: {
                    clientId_modelId: {
                        clientId: originalEntry.clientId,
                        modelId: originalEntry.modelId
                    }
                },
                data: {
                    currentBalance: { decrement: qty },
                    lastMessage: "Initial stock addition deleted",
                    lastUpdatedBy: activeUserId
                }
            });
        });

        return res.status(200).json({
            success: true,
            message: "Stock addition deleted successfully",
            data: {
                originalTransferGroupId: transferGroupId
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to delete stock addition"
        });
    }
};
