import prisma from "../../../config/db.js";

// 2. Toggle Status (Instead of Deleting)
export const toggleClientStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the current status of the client
        const client = await prisma.client.findUnique({
            where: { id },
            select: { isActive: true } // We only need the current status
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // 2. Update to the opposite value (!)
        const updatedClient = await prisma.client.update({
            where: { id },
            data: { isActive: !client.isActive }
        });

        res.status(200).json({
            message: `Client status flipped to ${updatedClient.isActive ? 'Active' : 'Inactive'}`,
            client: updatedClient
        });
    } catch (error) {
        console.error("Toggle Error:", error);
        res.status(500).json({ message: "Error toggling status" });
    }
};