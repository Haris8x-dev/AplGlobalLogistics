import prisma from "../../config/db.js";

export const getMasterInventory = async (req, res) => {
    try {
        const stock = await prisma.clientStock.findMany({
            include: {
                client: { select: { companyName: true } },
                model: { select: { name: true } },
                user: { select: { fullName: true } } // Shows the employee name who last touched it
            }
        });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClientInventory = async (req, res) => {
    try {
        const { clientId } = req.params;

        const stock = await prisma.clientStock.findMany({
            where: { clientId },
            include: {
                model: {
                    select: {
                        id: true,
                        name: true,
                        category: {
                            select: { name: true }
                        }
                    }
                },
                user: { select: { fullName: true } }
            },
            orderBy: {
                currentBalance: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            count: stock.length,
            inventory: stock
        });
    } catch (error) {
        console.error("Error fetching client inventory:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};