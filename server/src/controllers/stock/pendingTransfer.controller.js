import prisma from "../../config/db.js";

class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

const parsePositiveInteger = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
};

const sendError = (res, error, fallbackMessage) => {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
    }

    console.error(fallbackMessage, error);
    return res.status(500).json({ success: false, error: fallbackMessage });
};

// PROCEED: Approves the transfer and updates ClientStock balances
export const proceedTransfer = async (req, res) => {
    try {
        const { transferGroupId } = req.params;
        const activeUserId = req.user.id;

        if (!transferGroupId) {
            return res.status(400).json({ success: false, error: "transferGroupId is required" });
        }

        const proceedResult = await prisma.$transaction(async (tx) => {
            const movements = await tx.stockMovement.findMany({
                where: { transferGroupId },
            });

            if (movements.length === 0) {
                throw new HttpError(404, "Transfer not found");
            }

            if (movements.some((movement) => movement.status !== "PENDING")) {
                throw new HttpError(409, "Transfer is already processed");
            }

            const isAddStock = movements.length === 1 && movements[0].quantity > 0;
            const outRow = movements.find((movement) => movement.quantity < 0);
            const inRow = movements.find((movement) => movement.quantity > 0);

            if (!isAddStock && (!outRow || !inRow)) {
                throw new HttpError(400, "Invalid transfer group");
            }

            if (isAddStock) {
                const m = movements[0];
                const qty = m.quantity;

                if (!Number.isInteger(qty) || qty <= 0) {
                    throw new HttpError(400, "Invalid stock quantity in pending record");
                }

                const statusUpdate = await tx.stockMovement.updateMany({
                    where: { id: m.id, status: "PENDING" },
                    data: { status: "COMPLETED" },
                });

                if (statusUpdate.count !== 1) {
                    throw new HttpError(409, "Transfer is already processed");
                }

                await tx.clientStock.upsert({
                    where: {
                        clientId_modelId: {
                            clientId: m.clientId,
                            modelId: m.modelId,
                        },
                    },
                    update: {
                        currentBalance: { increment: qty },
                        lastMessage: m.message,
                        lastUpdatedBy: activeUserId,
                    },
                    create: {
                        clientId: m.clientId,
                        modelId: m.modelId,
                        currentBalance: qty,
                        lastMessage: m.message,
                        lastUpdatedBy: activeUserId,
                    },
                });

                return { isAddStock: true };
            } else {
                const qty = Math.abs(outRow.quantity);

                if (!Number.isInteger(qty) || qty <= 0) {
                    throw new HttpError(400, "Invalid stock quantity in pending transfer");
                }

                const expectedRows = movements.length;
                const statusUpdate = await tx.stockMovement.updateMany({
                    where: { transferGroupId, status: "PENDING" },
                    data: { status: "COMPLETED" },
                });

                if (statusUpdate.count !== expectedRows) {
                    throw new HttpError(409, "Transfer is already processed");
                }

                const sourceStock = await tx.clientStock.findUnique({
                    where: {
                        clientId_modelId: {
                            clientId: outRow.clientId,
                            modelId: outRow.modelId,
                        },
                    },
                });

                if (!sourceStock || sourceStock.currentBalance < qty) {
                    throw new HttpError(400, "Insufficient stock at source client");
                }

                await tx.clientStock.update({
                    where: {
                        clientId_modelId: {
                            clientId: outRow.clientId,
                            modelId: outRow.modelId,
                        },
                    },
                    data: {
                        currentBalance: { decrement: qty },
                        lastMessage: outRow.message,
                        lastUpdatedBy: activeUserId,
                    },
                });

                await tx.clientStock.upsert({
                    where: {
                        clientId_modelId: {
                            clientId: inRow.clientId,
                            modelId: inRow.modelId,
                        },
                    },
                    update: {
                        currentBalance: { increment: qty },
                        lastMessage: inRow.message,
                        lastUpdatedBy: activeUserId,
                    },
                    create: {
                        clientId: inRow.clientId,
                        modelId: inRow.modelId,
                        currentBalance: qty,
                        lastMessage: inRow.message,
                        lastUpdatedBy: activeUserId,
                    },
                });

                return { isAddStock: false };
            }
        });

        return res.status(200).json({
            success: true,
            message: proceedResult.isAddStock
                ? "Pending stock addition approved successfully"
                : "Transfer completed successfully",
        });
    } catch (error) {
        return sendError(res, error, "Failed to proceed transfer");
    }
};

// CANCEL: Suspends the transfer without affecting ClientStock
export const cancelTransfer = async (req, res) => {
    try {
        const { transferGroupId } = req.params;

        if (!transferGroupId) {
            return res.status(400).json({ success: false, error: "transferGroupId is required" });
        }

        const cancellationResult = await prisma.$transaction(async (tx) => {
            const movements = await tx.stockMovement.findMany({
                where: { transferGroupId },
            });

            if (movements.length === 0) {
                throw new HttpError(404, "Transfer not found");
            }

            if (movements.some((movement) => movement.status !== "PENDING")) {
                throw new HttpError(409, "Only PENDING transfers can be cancelled");
            }

            const isAddStock = movements.length === 1 && movements[0].quantity > 0;

            if (isAddStock) {
                const deleted = await tx.stockMovement.deleteMany({
                    where: { transferGroupId, status: "PENDING" },
                });

                if (deleted.count !== 1) {
                    throw new HttpError(409, "Transfer is already processed");
                }

                return { isAddStock: true };
            }

            const cancelled = await tx.stockMovement.updateMany({
                where: { transferGroupId, status: "PENDING" },
                data: { status: "CANCELLED" },
            });

            if (cancelled.count !== movements.length) {
                throw new HttpError(409, "Transfer is already processed");
            }

            return { isAddStock: false };
        });

        return res.status(200).json({
            success: true,
            message: cancellationResult.isAddStock
                ? "Entry deleted successfully"
                : "Transfer successfully cancelled",
        });
    } catch (error) {
        return sendError(res, error, "Failed to cancel transfer");
    }
};

// EDIT: Allows modifying a pending transfer (including Add Stock)
export const editPendingTransfer = async (req, res) => {
    try {
        const { transferGroupId } = req.params;
        const { quantity, awb, jobNo, toClientId } = req.body;

        if (!transferGroupId) {
            return res.status(400).json({ success: false, error: "transferGroupId is required" });
        }

        const hasQuantity = quantity !== undefined && quantity !== null && quantity !== "";
        const qty = parsePositiveInteger(quantity);

        if (hasQuantity && qty === null) {
            return res.status(400).json({ success: false, error: "Quantity must be greater than 0" });
        }

        if (toClientId !== undefined && (typeof toClientId !== "string" || !toClientId.trim())) {
            return res.status(400).json({ success: false, error: "toClientId must be a valid non-empty string" });
        }

        const hasUpdates =
            hasQuantity ||
            awb !== undefined ||
            jobNo !== undefined ||
            toClientId !== undefined;

        if (!hasUpdates) {
            return res.status(400).json({ success: false, error: "No editable fields were provided" });
        }

        await prisma.$transaction(async (tx) => {
            const movements = await tx.stockMovement.findMany({
                where: { transferGroupId },
            });

            if (movements.length === 0) {
                throw new HttpError(404, "Transfer not found");
            }

            if (movements.some((movement) => movement.status !== "PENDING")) {
                throw new HttpError(409, "Only PENDING transfers can be edited");
            }

            const normalizedToClientId = typeof toClientId === "string" ? toClientId.trim() : undefined;

            if (normalizedToClientId) {
                const targetClient = await tx.client.findUnique({
                    where: { id: normalizedToClientId },
                    select: { id: true },
                });

                if (!targetClient) {
                    throw new HttpError(404, "Destination client not found");
                }
            }

            const isAddStock = movements.length === 1 && movements[0].quantity > 0;

            if (isAddStock) {
                const updateData = {};
                if (qty !== null) updateData.quantity = qty;
                if (awb !== undefined) updateData.awb = awb;
                if (jobNo !== undefined) updateData.jobNo = jobNo;
                if (normalizedToClientId) {
                    updateData.clientId = normalizedToClientId;
                }

                if (Object.keys(updateData).length > 0) {
                    const updated = await tx.stockMovement.updateMany({
                        where: { id: movements[0].id, status: "PENDING" },
                        data: updateData,
                    });

                    if (updated.count !== 1) {
                        throw new HttpError(409, "Transfer is already processed");
                    }
                }

                return;
            }

            const outRow = movements.find((movement) => movement.quantity < 0);
            const inRow = movements.find((movement) => movement.quantity > 0);

            if (!outRow || !inRow) {
                throw new HttpError(400, "Invalid transfer group");
            }

            if (normalizedToClientId && normalizedToClientId === outRow.clientId) {
                throw new HttpError(400, "Destination client must be different from source client");
            }

            const outUpdateData = {};
            if (qty !== null) outUpdateData.quantity = -qty;
            if (awb !== undefined) outUpdateData.awb = awb;
            if (jobNo !== undefined) outUpdateData.jobNo = jobNo;
            if (normalizedToClientId) outUpdateData.toClientId = normalizedToClientId;

            if (Object.keys(outUpdateData).length > 0) {
                const outUpdated = await tx.stockMovement.updateMany({
                    where: { id: outRow.id, status: "PENDING" },
                    data: outUpdateData,
                });

                if (outUpdated.count !== 1) {
                    throw new HttpError(409, "Transfer is already processed");
                }
            }

            const inUpdateData = {};
            if (qty !== null) inUpdateData.quantity = qty;
            if (awb !== undefined) inUpdateData.awb = awb;
            if (jobNo !== undefined) inUpdateData.jobNo = jobNo;
            if (normalizedToClientId) {
                inUpdateData.clientId = normalizedToClientId;
                inUpdateData.toClientId = normalizedToClientId;
            }

            if (Object.keys(inUpdateData).length > 0) {
                const inUpdated = await tx.stockMovement.updateMany({
                    where: { id: inRow.id, status: "PENDING" },
                    data: inUpdateData,
                });

                if (inUpdated.count !== 1) {
                    throw new HttpError(409, "Transfer is already processed");
                }
            }
        });

        return res.status(200).json({ success: true, message: "Transfer successfully updated" });

    } catch (error) {
        return sendError(res, error, "Failed to update transfer");
    }
};