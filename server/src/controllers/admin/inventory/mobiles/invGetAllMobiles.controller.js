import prisma from "../../../../config/db.js";

// Get All Mobile Models (for Admin Management)
export const getAllMobileModels = async (req, res) => {
    try {
        const models = await prisma.mobileModel.findMany({
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            models
        });
    } catch (error) {
        console.error("Get All Models Error:", error);
        res.status(500).json({ message: "Error fetching mobile models" });
    }
};
