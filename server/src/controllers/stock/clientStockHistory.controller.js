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

export const getRecentMovements = async (req, res) => {
    try {
        // We take a 'limit' from the query, or default to 20
        const limit = parseInt(req.query.limit) || 20;

        const movements = await prisma.stockMovement.findMany({
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                // Show the employee's name
                user: { 
                    select: { fullName: true } 
                },
                // Show the phone model name
                model: { 
                    select: { name: true } 
                },
                // Show the owner of this specific ledger row
                client: { 
                    select: { companyName: true } 
                }
            }
        });

        res.status(200).json({
            success: true,
            count: movements.length,
            data: movements
        });
    } catch (error) {
        console.error("Error fetching recent movements:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch activity feed", 
            error: error.message 
        });
    }
};