import prisma from "../../../../config/db.js";

// Update a Mobile Model (name, category, or isActive status)
export const updateMobileModel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, categoryId, isActive } = req.body;

        // 1. Check if the model exists
        const existingModel = await prisma.mobileModel.findUnique({
            where: { id }
        });

        if (!existingModel) {
            return res.status(404).json({ message: "Mobile model not found" });
        }

        // 2. Validate categoryId if provided
        if (categoryId) {
            const categoryExists = await prisma.category.findUnique({
                where: { id: categoryId }
            });

            if (!categoryExists) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
        }

        // 3. Build update data object (only include fields that are provided)
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (isActive !== undefined) updateData.isActive = isActive;

        // 4. Update the model
        const updatedModel = await prisma.mobileModel.update({
            where: { id },
            data: updateData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Model updated successfully",
            model: updatedModel
        });
    } catch (error) {
        console.error("Update Model Error:", error);
        res.status(500).json({ message: "Error updating mobile model" });
    }
};
