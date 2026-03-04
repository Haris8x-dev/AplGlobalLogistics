import prisma from "../../../config/db.js";


// 3. Add Mobile Model to a Category
export const addMobileModel = async (req, res) => {
    try {
        const { name, categoryId } = req.body;

        // Validation: Ensure the admin sent both
        if (!name || !categoryId) {
            return res.status(400).json({ message: "Model name and Category ID are required" });
        }

        // Create the model linked to the category
        const newModel = await prisma.mobileModel.create({
            data: {
                name,
                categoryId // This is the ID passed from your frontend dropdown
            }
        });

        res.status(201).json({
            success: true,
            message: "Model added successfully",
            model: newModel
        });
    } catch (error) {
        console.error("Error adding model:", error);
        res.status(500).json({ message: "Error adding model. Check if Category ID is valid." });
    }
};
