import prisma from '../../config/db.js';

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

// 5. Get Categories with their Models (Filtered by isActive)
export const getActiveInventory = async (req, res) => {
    try {
        const inventory = await prisma.category.findMany({
            where: {
                isActive: true // 👈 ONLY fetch categories that are active
            },
            include: {
                models: true // This will still fetch the models for these active categories
            },
            orderBy: {
                name: 'asc' // Keeps things organized alphabetically
            }
        });

        // Optional: Validation check to handle empty results
        if (inventory.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No active categories found.",
                inventory: []
            });
        }

        res.status(200).json({
            success: true,
            inventory
        });
    } catch (error) {
        console.error("Fetch Inventory Error:", error);
        res.status(500).json({ message: "Error fetching active inventory" });
    }
};

// 5. Delete a specific Mobile Model
export const deleteMobileModel = async (req, res) => {
    try {
        const { id } = req.params; // The ID of the model to delete

        // 1. Check if the model exists before trying to delete
        const existingModel = await prisma.mobileModel.findUnique({
            where: { id }
        });

        if (!existingModel) {
            return res.status(404).json({ message: "Mobile model not found" });
        }

        // 2. Perform the deletion
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
