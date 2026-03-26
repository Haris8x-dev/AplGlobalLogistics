import prisma from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

const enrichMovementsWithClients = async (movements) => {
    if (!movements.length) {
        return [];
    }

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

    return Promise.all(
        movements.map(async (movement) => {
            let fromClient = null;
            let toClient = null;

            if (movement.fromClientId) {
                fromClient = await prisma.client.findUnique({
                    where: { id: movement.fromClientId },
                    select: { companyName: true }
                });
            }

            if (movement.toClientId) {
                toClient = await prisma.client.findUnique({
                    where: { id: movement.toClientId },
                    select: { companyName: true }
                });
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
        })
    );
};

export const getClientStockHistory = async (req, res) => {
    try {
        const { clientId, modelId } = req.params;

        const history = await prisma.stockMovement.findMany({
            where: { clientId, modelId },
            include: {
                user: { select: { fullName: true } }, // The Employee who did it
                model: { select: { name: true } }    // The Phone name
            },
            orderBy: { createdAt: 'desc' }
        });

        const enrichedHistory = await enrichMovementsWithClients(history);

        // Backfill transferGroupId for old entries that don't have it
        const historyWithGroupIds = enrichedHistory.map((record) => ({
            ...record,
            transferGroupId: record.transferGroupId || record.id  // Fallback to record ID for old entries
        }));

        res.status(200).json({ success: true, data: historyWithGroupIds });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRecentMovements = async (req, res) => {
    try {
        // We take a 'limit' from the query, or default to 20
        const limit = parseInt(req.query.limit) || 20;

        const movements = await prisma.stockMovement.findMany({
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
            data: enrichedMovements
        });
    } catch (error) {
        console.error("Error fetching recent movements:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch activity feed",
            error: error.message
        });
    }
};