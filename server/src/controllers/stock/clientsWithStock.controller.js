import prisma from "../../config/db.js";

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;

export const getClientsWithStock = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const pageSize = Math.min(parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

        const totalCount = await prisma.client.count({
            where: { isActive: true }
        });

        const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
        const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
        const skip = (currentPage - 1) * pageSize;

        const clients = await prisma.client.findMany({
            where: {
                isActive: true
            },
            skip,
            take: pageSize,
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
            phone: client.phoneNumber,
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
            clients: formattedClients,
            pagination: {
                page: currentPage,
                pageSize,
                totalCount,
                totalPages,
                hasPreviousPage: currentPage > 1,
                hasNextPage: currentPage < totalPages,
            }
        });
    } catch (error) {
        console.error("Error fetching clients with stock:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching clients with stock"
        });
    }
};
