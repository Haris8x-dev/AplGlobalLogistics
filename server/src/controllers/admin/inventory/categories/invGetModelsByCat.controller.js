import prisma from "../../../../config/db.js";

export const getModelsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // 1. Fetch the category and its related models
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                models: {
                    orderBy: { name: 'asc' }
                }
            }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            categoryName: category.name,
            models: category.models // This will now return all models in this category
        });

    } catch (error) {
        console.error("Fetch Models Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching models for this category"
        });
    }
};