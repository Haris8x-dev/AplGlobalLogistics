import prisma from "../../../config/db.js";

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