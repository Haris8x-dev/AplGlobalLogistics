import prisma from "../../../../config/db.js";

// 4. [ADMIN MASTER VIEW] - Shows Everything (Active + Inactive)
export const getAdminInventory = async (req, res) => {
    try {
        const inventory = await prisma.category.findMany({
            include: { models: true },
            orderBy: { name: 'asc' }
        });

        res.status(200).json({
            success: true,
            totalCategories: inventory.length,
            inventory
        });
    } catch (error) {
        console.error("Admin Inventory Error:", error);
        res.status(500).json({ message: "Error fetching master inventory list" });
    }
};
