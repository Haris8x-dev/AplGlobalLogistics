import prisma from "../../../../config/db.js";


export const addMobileModel = async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        if (!name || !categoryId) {
            return res.status(400).json({ message: "Model name and Category ID are required" });
        }

        const newModel = await prisma.mobileModel.create({
            data: {
                name,
                categoryId,
                isActive: true // Explicitly setting it to true on creation
            }
        });

        res.status(201).json({
            success: true,
            message: "Model added successfully",
            model: newModel
        });
    } catch (error) {
        res.status(500).json({ message: "Error adding model. Check if Category ID is valid." });
    }
};
