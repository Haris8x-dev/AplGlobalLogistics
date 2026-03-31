import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const getPoolConfig = () => {
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
        };
    }

    const required = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length) {
        throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
    }

    const parsedPort = Number.parseInt(process.env.DB_PORT || '5432', 10);

    if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
        throw new Error('DB_PORT must be a valid positive integer');
    }

    return {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parsedPort,
    };
};

const pool = new pg.Pool(getPoolConfig());

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;