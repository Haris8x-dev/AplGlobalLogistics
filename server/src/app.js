import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';


// Pointing to the new organized routes folder
import authRoutes from './routes/auth/authRoutes.js';
import clientRoutes from './routes/admin/clientRoutes.js';
import inventoryRoutes from './routes/admin/inventoryRoutes.js'; 
import stockRoutes from './routes/stock/stockRoutes.js';

dotenv.config();
const app = express();


app.use(cors());
app.use(express.json());
app.use(cookieParser());


// Main Entry for Auth APIs
app.use('/api/auth', authRoutes);
app.use('/api/admin/clients', clientRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/stock', stockRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'APL Core Server is Healthy' });
});

export default app;