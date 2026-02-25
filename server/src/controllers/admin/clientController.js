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


// 4. Update Client Details
export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, contactName, email, phoneNumber, address, industry } = req.body;

        // 1. Verify client exists
        const existingClient = await prisma.client.findUnique({ where: { id } });
        if (!existingClient) {
            return res.status(404).json({ message: "Client not found" });
        }

        // 2. Prepare dynamic update object (only update what is provided)
        const updateData = {};
        if (companyName) updateData.companyName = companyName;
        if (contactName) updateData.contactName = contactName;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (address) updateData.address = address;
        if (industry) updateData.industry = industry;

        // 3. Perform the update
        const updatedClient = await prisma.client.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: "Client updated successfully",
            client: updatedClient
        });

    } catch (error) {
        console.error("Update Client Error:", error);

        // Check for Prisma unique constraint error (P2002) for the email field
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Another client is already using this email address." });
        }

        res.status(500).json({ message: "Error updating client details" });
    }
};