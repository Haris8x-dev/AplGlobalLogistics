import prisma from "../../../config/db.js";

// 3. Get Clients (Option to filter active only)
export const getClients = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        clientStocks: true
                    }
                }
            }
        });

        // Aggregate the sum of current balances for each client directly from DB
        const stockSums = await prisma.clientStock.groupBy({
            by: ['clientId'],
            _sum: {
                currentBalance: true
            }
        });

        const stockMap = new Map(
            stockSums.map((item) => [item.clientId, item._sum.currentBalance ?? 0])
        );

        const clientsWithTotalStock = clients.map((client) => ({
            ...client,
            totalStockUnits: stockMap.get(client.id) ?? 0
        }));

        res.status(200).json({ success: true, clients: clientsWithTotalStock });
    } catch (error) {
        res.status(500).json({ message: "Error fetching clients" });
    }
};