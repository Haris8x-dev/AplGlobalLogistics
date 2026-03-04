import prisma from "../../../config/db.js";

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