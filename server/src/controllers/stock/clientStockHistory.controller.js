import prisma from "../../config/db.js";

const VALID_STATUSES = new Set(["PENDING", "COMPLETED", "CANCELLED"]);
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseDateParts = (dateValue) => {
    if (!dateValue) {
        return null;
    }

    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        return null;
    }

    return { year, month, day };
};

const localDateToUtcBoundary = (dateValue, timezoneOffsetMinutes, addDays = 0) => {
    const parts = parseDateParts(dateValue);
    if (!parts) {
        return null;
    }

    const baseUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day + addDays, 0, 0, 0, 0);
    return new Date(baseUtcMs + timezoneOffsetMinutes * 60 * 1000);
};

const buildCreatedAtRange = (fromDate, toDate, timezoneOffsetMinutes = 0) => {
    const range = {};

    if (fromDate) {
        const from = localDateToUtcBoundary(fromDate, timezoneOffsetMinutes);
        if (!Number.isNaN(from.getTime())) {
            range.gte = from;
        }
    }

    if (toDate) {
        const to = localDateToUtcBoundary(toDate, timezoneOffsetMinutes, 1);
        if (!Number.isNaN(to.getTime())) {
            range.lt = to;
        }
    }

    return Object.keys(range).length ? range : undefined;
};

const enrichMovementsWithClients = async (movements) => {
    if (!movements.length) {
        return [];
    }

    const clientIds = [
        ...new Set(
            movements
                .flatMap((movement) => [movement.fromClientId, movement.toClientId])
                .filter(Boolean)
        )
    ];

    const clients = clientIds.length
        ? await prisma.client.findMany({
            where: { id: { in: clientIds } },
            select: { id: true, companyName: true }
        })
        : [];

    const clientsById = new Map(
        clients.map((client) => [client.id, { companyName: client.companyName }])
    );

    const groupIds = [...new Set(movements.map((m) => m.transferGroupId).filter(Boolean))];

    const groupPeers = groupIds.length
        ? await prisma.stockMovement.findMany({
            where: {
                transferGroupId: { in: groupIds }
            },
            select: {
                transferGroupId: true,
                quantity: true,
                client: {
                    select: { companyName: true }
                }
            }
        })
        : [];

    const peersByGroup = groupPeers.reduce((acc, peer) => {
        if (!peer.transferGroupId) {
            return acc;
        }
        if (!acc[peer.transferGroupId]) {
            acc[peer.transferGroupId] = [];
        }
        acc[peer.transferGroupId].push(peer);
        return acc;
    }, {});

    return movements.map((movement) => {
        let fromClient = null;
        let toClient = null;

        if (movement.fromClientId) {
            fromClient = clientsById.get(movement.fromClientId) || null;
        }

        if (movement.toClientId) {
            toClient = clientsById.get(movement.toClientId) || null;
        }

        // Fallback for legacy/missing ids: infer counterpart client by transfer group and sign.
        if ((!fromClient || !toClient) && movement.transferGroupId) {
            const peers = peersByGroup[movement.transferGroupId] || [];

            if (!fromClient) {
                if (movement.quantity > 0) {
                    const sourcePeer = peers.find((peer) => peer.quantity < 0);
                    fromClient = sourcePeer?.client || null;
                } else if (movement.quantity < 0) {
                    const sameRowClient = peers.find((peer) => peer.quantity < 0)?.client;
                    fromClient = sameRowClient || null;
                }
            }

            if (!toClient) {
                if (movement.quantity < 0) {
                    const destinationPeer = peers.find((peer) => peer.quantity > 0);
                    toClient = destinationPeer?.client || null;
                } else if (movement.quantity > 0) {
                    const sameRowClient = peers.find((peer) => peer.quantity > 0)?.client;
                    toClient = sameRowClient || null;
                }
            }
        }

        return {
            ...movement,
            fromClient,
            toClient
        };
    });
};

export const getClientStockHistory = async (req, res) => {
    try {
        const { clientId, modelId } = req.params;
        const page = parsePositiveInt(req.query.page, 1);
        const pageSize = Math.min(parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
        const fromDate = req.query.fromDate?.toString().trim();
        const toDate = req.query.toDate?.toString().trim();
        const statusQuery = req.query.status?.toString().trim().toUpperCase();
        const timezoneOffsetMinutes = Number.parseInt(req.query.timezoneOffsetMinutes, 10) || 0;

        if (statusQuery && !VALID_STATUSES.has(statusQuery)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status filter. Use PENDING, COMPLETED, or CANCELLED."
            });
        }

        const where = { clientId, modelId };
        const createdAtRange = buildCreatedAtRange(fromDate, toDate, timezoneOffsetMinutes);

        if (createdAtRange) {
            where.createdAt = createdAtRange;
        }

        if (statusQuery) {
            where.status = statusQuery;
        }

        const totalCount = await prisma.stockMovement.count({ where });
        const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
        const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
        const skip = (currentPage - 1) * pageSize;

        const [history, currentStock] = await Promise.all([
            totalCount > 0
                ? prisma.stockMovement.findMany({
                    where,
                    include: {
                        user: { select: { fullName: true } },
                        model: { select: { name: true } }
                    },
                    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                    skip,
                    take: pageSize
                })
                : Promise.resolve([]),
            prisma.clientStock.findUnique({
                where: {
                    clientId_modelId: {
                        clientId,
                        modelId
                    }
                },
                select: { currentBalance: true }
            })
        ]);

        const enrichedHistory = await enrichMovementsWithClients(history);

        // Backfill transferGroupId for old entries that don't have it
        const historyWithGroupIds = enrichedHistory.map((record) => ({
            ...record,
            transferGroupId: record.transferGroupId || record.id  // Fallback to record ID for old entries
        }));

        const currentBalance = currentStock?.currentBalance ?? 0;
        let runningEndingBalance = currentBalance;

        const historyWithBalances = historyWithGroupIds.map((record) => {
            const effectiveQuantity = record.status === "COMPLETED" ? record.quantity : 0;
            const endingBalance = runningEndingBalance;
            const startingBalance = endingBalance - effectiveQuantity;
            runningEndingBalance = startingBalance;

            return {
                ...record,
                startingBalance,
                endingBalance
            };
        });

        const dailyBalanceMap = new Map();

        historyWithBalances.forEach((record) => {
            const dateKey = new Date(record.movementDate || record.createdAt)
                .toISOString()
                .split("T")[0];

            if (!dailyBalanceMap.has(dateKey)) {
                dailyBalanceMap.set(dateKey, {
                    date: dateKey,
                    startingBalance: record.startingBalance,
                    endingBalance: record.endingBalance,
                    movementCount: 0,
                    netChange: 0
                });
            }

            const summary = dailyBalanceMap.get(dateKey);
            summary.startingBalance = record.startingBalance;
            summary.movementCount += 1;

            if (record.status === "COMPLETED") {
                summary.netChange += record.quantity;
            }
        });

        const dailyBalances = Array.from(dailyBalanceMap.values());

        res.status(200).json({
            success: true,
            data: historyWithBalances,
            pagination: {
                page: currentPage,
                pageSize,
                totalCount,
                totalPages,
                hasPreviousPage: currentPage > 1,
                hasNextPage: currentPage < totalPages
            },
            filters: {
                fromDate: fromDate || null,
                toDate: toDate || null,
                status: statusQuery || null
            },
            balance: {
                currentBalance
            },
            dailyBalances
        });
    } catch (error) {
        console.error("Error fetching client stock history:", error);
        res.status(500).json({ success: false, error: "Failed to fetch stock history" });
    }
};

export const getRecentMovements = async (req, res) => {
    try {
        const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
        const fromDate = req.query.fromDate?.toString().trim();
        const toDate = req.query.toDate?.toString().trim();
        const statusQuery = req.query.status?.toString().trim().toUpperCase();
        const timezoneOffsetMinutes = Number.parseInt(req.query.timezoneOffsetMinutes, 10) || 0;

        if (statusQuery && !VALID_STATUSES.has(statusQuery)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status filter. Use PENDING, COMPLETED, or CANCELLED."
            });
        }

        const where = {};
        const createdAtRange = buildCreatedAtRange(fromDate, toDate, timezoneOffsetMinutes);

        if (createdAtRange) {
            where.createdAt = createdAtRange;
        }

        if (statusQuery) {
            where.status = statusQuery;
        }

        const movements = await prisma.stockMovement.findMany({
            where,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                // Show the employee's name
                user: {
                    select: { fullName: true }
                },
                // Show the phone model name
                model: {
                    select: { name: true }
                },
                // Show the owner of this specific ledger row
                client: {
                    select: { companyName: true }
                }
            }
        });

        const enrichedMovements = await enrichMovementsWithClients(movements);

        res.status(200).json({
            success: true,
            count: enrichedMovements.length,
            data: enrichedMovements,
            filters: {
                fromDate: fromDate || null,
                toDate: toDate || null,
                status: statusQuery || null
            }
        });
    } catch (error) {
        console.error("Error fetching recent movements:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch activity feed"
        });
    }
};