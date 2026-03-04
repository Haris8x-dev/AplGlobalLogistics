import prisma from "../../config/db.js";

export const getClientStockHistory = async (req, res) => {
    try {
        const { clientId, modelId } = req.params;

        const history = await prisma.stockMovement.findMany({
            where: { clientId, modelId },
            include: {
                user: { select: { fullName: true } }, // The Employee who did it
                model: { select: { name: true } }    // The Phone name
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};