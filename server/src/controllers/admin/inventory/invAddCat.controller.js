import prisma from "../../../config/db.js";

// 1. Add Category (e.g., Apple, Samsung)
export const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const newCategory = await prisma.category.create({ data: { name } });
        res.status(201).json({ success: true, category: newCategory });
    } catch (error) {
        res.status(500).json({ message: "Error creating category" });
    }
};

