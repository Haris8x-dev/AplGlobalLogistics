import prisma from "../../../../config/db.js";

// 2. Toggle Category Status (Active/Inactive)
export const toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({ where: { id } });
        const updated = await prisma.category.update({
            where: { id },
            data: { isActive: !category.isActive }
        });
        res.status(200).json({ message: `Category ${updated.name} is now ${updated.isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        res.status(500).json({ message: "Error toggling status" });
    }
};