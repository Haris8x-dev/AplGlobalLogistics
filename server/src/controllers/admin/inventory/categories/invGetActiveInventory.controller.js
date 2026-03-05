import prisma from "../../../../config/db.js";

// 5. Get Categories with their Models (Filtered by isActive)
export const getActiveInventory = async (req, res) => {
    try {
        const inventory = await prisma.category.findMany({
            where: {
                isActive: true // 👈 ONLY fetch categories that are active
            },
            include: {
                models: true // This will still fetch the models for these active categories
            },
            orderBy: {
                name: 'asc' // Keeps things organized alphabetically
            }
        });

        // Optional: Validation check to handle empty results
        if (inventory.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No active categories found.",
                inventory: []
            });
        }

        res.status(200).json({
            success: true,
            inventory
        });
    } catch (error) {
        console.error("Fetch Inventory Error:", error);
        res.status(500).json({ message: "Error fetching active inventory" });
    }
};