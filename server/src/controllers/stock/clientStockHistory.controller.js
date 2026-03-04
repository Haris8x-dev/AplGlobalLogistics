import prisma from "../../config/db.js";

export const getClientStockHistory = async (req, res) => {
    try {
        // We take both from the URL parameters for a clean API structure
        const { clientId, modelId } = req.params;

        const history = await prisma.stockMovement.findMany({
            where: {
                clientId: clientId,
                modelId: modelId
            },
            include: {
                user: { select: { fullName: true } }, // Who did the move
                model: { select: { name: true } }     // Confirming the model name
            },
            orderBy: {
                createdAt: 'desc' // Newest first
            }
        });

        if (!history.length) {
            return res.status(404).json({ 
                message: "No history found for this specific model at this client." 
            });
        }

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};