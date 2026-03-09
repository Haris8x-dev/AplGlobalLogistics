import prisma from "../../config/db.js";

export const getClientsWithStock = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            where: {
                isActive: true
            },
            include: {
                clientStocks: {
                    where: {
                        currentBalance: {
                            gt: 0
                        }
                    },
                    include: {
                        model: {
                            include: {
                                category: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                companyName: 'asc'
            }
        });

        // Format the response
        const formattedClients = clients.map(client => ({
            id: client.id,
            companyName: client.companyName,
            contactName: client.contactName,
            address: client.address,
            email: client.email,
            phone: client.phone,
            isActive: client.isActive,
            stockSummary: client.clientStocks.map(stock => ({
                modelId: stock.model.id,
                modelName: stock.model.name,
                categoryId: stock.model.categoryId,
                categoryName: stock.model.category.name,
                quantity: stock.currentBalance
            }))
        }));

        res.status(200).json({
            success: true,
            clients: formattedClients
        });
    } catch (error) {
        console.error("Error fetching clients with stock:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching clients with stock"
        });
    }
};
