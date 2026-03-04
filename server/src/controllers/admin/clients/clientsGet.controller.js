import prisma from "../../../config/db.js";

// 3. Get Clients (Option to filter active only)
export const getClients = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, clients });
    } catch (error) {
        res.status(500).json({ message: "Error fetching clients" });
    }
};