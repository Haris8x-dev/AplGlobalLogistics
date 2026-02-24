import prisma from '../../config/db.js';

// 1. Add Client
export const addClient = async (req, res) => {
    try {
        const { companyName, contactName, email, phoneNumber, address, industry } = req.body;

        const existingClient = await prisma.client.findUnique({ where: { email } });
        if (existingClient) {
            return res.status(400).json({ message: "Client with this email already exists." });
        }

        const newClient = await prisma.client.create({
            data: { companyName, contactName, email, phoneNumber, address, industry }
        });

        res.status(201).json({ success: true, client: newClient });
    } catch (error) {
        // ADD THIS LINE TO SEE THE REAL ERROR IN TERMINAL
        console.error("DETAILED PRISMA ERROR:", error);

        res.status(500).json({ message: "Error adding client", details: error.message });
    }
};

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