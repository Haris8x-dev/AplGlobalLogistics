import prisma  from "../../config/db.js";

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