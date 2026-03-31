import prisma from "../../config/db.js";

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export const getMasterInventory = async (req, res) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const pageSize = Math.min(parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

        const totalCount = await prisma.clientStock.count();
        const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
        const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
        const skip = (currentPage - 1) * pageSize;

        const stock = await prisma.clientStock.findMany({
            include: {
                client: { select: { companyName: true } },
                model: { select: { name: true } },
                user: { select: { fullName: true } } // Shows the employee name who last touched it
            },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
            skip,
            take: pageSize,
        });

        res.status(200).json({
            success: true,
            data: stock,
            pagination: {
                page: currentPage,
                pageSize,
                totalCount,
                totalPages,
                hasPreviousPage: currentPage > 1,
                hasNextPage: currentPage < totalPages,
            },
        });
    } catch (error) {
        console.error("Error fetching master inventory:", error);
        res.status(500).json({ success: false, error: "Failed to fetch master inventory" });
    }
};

export const getClientInventory = async (req, res) => {
    try {
        const { clientId } = req.params;

        const stock = await prisma.clientStock.findMany({
            where: { clientId },
            include: {
                model: {
                    select: {
                        id: true,
                        name: true,
                        category: {
                            select: { name: true }
                        }
                    }
                },
                user: { select: { fullName: true } }
            },
            orderBy: {
                currentBalance: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            count: stock.length,
            inventory: stock
        });
    } catch (error) {
        console.error("Error fetching client inventory:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch client inventory"
        });
    }
};