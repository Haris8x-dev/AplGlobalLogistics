import prisma from "../../../../config/db.js";

/**
 * Updates the name of an existing category.
 * URL: PATCH /api/admin/inventory/category/:id
 */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // 1. Validation
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "A valid category name (min 2 chars) is required."
            });
        }

        // 2. Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        // 3. Update the name
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: { name: name.trim() }
        });

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: updatedCategory
        });

    } catch (error) {
        console.error("Update Category Error:", error);
        // Handle unique constraint if category names must be unique
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "A category with this name already exists." });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};