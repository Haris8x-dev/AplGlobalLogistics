import prisma from "../../../../config/db.js";

// Toggle Mobile Model Status (Active/Inactive)
export const toggleMobileModelStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the model
        const model = await prisma.mobileModel.findUnique({
            where: { id }
        });

        if (!model) {
            return res.status(404).json({ message: "Mobile model not found" });
        }

        // 2. Toggle the isActive status
        const updatedModel = await prisma.mobileModel.update({
            where: { id },
            data: {
                isActive: !model.isActive
            },
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
            message: `Model ${updatedModel.isActive ? 'activated' : 'deactivated'} successfully`,
            model: updatedModel
        });
    } catch (error) {
        console.error("Toggle Model Status Error:", error);
        res.status(500).json({ message: "Error toggling model status" });
    }
};
