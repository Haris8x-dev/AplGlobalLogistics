import prisma from "../../../../config/db.js";

// 5. Delete a specific Mobile Model
export const deleteMobileModel = async (req, res) => {
    try {
        const { id } = req.params; // The ID of the model to delete

        // 1. Check if the model exists before trying to delete
        const existingModel = await prisma.mobileModel.findUnique({
            where: { id },
            include: {
                stockMovements: true,
                clientStocks: true
            }
        });

        if (!existingModel) {
            return res.status(404).json({ message: "Mobile model not found" });
        }

        // 2. Check if the model has any stock movements or client stocks
        if (existingModel.stockMovements.length > 0 || existingModel.clientStocks.length > 0) {
            return res.status(400).json({
                message: "Cannot delete model with existing stock records. Please deactivate it instead."
            });
        }

        // 3. Perform the deletion (only if no stock records exist)
        await prisma.mobileModel.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: `Model '${existingModel.name}' deleted successfully`
        });
    } catch (error) {
        console.error("Delete Model Error:", error);
        res.status(500).json({ message: "Error deleting mobile model" });
    }
};
