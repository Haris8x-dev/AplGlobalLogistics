import cors from "cors";
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';


// Pointing to the new organized routes folder
import authRoutes from './routes/auth/authRoutes.js';
import clientRoutes from './routes/admin/clientRoutes.js';
import inventoryRoutes from './routes/admin/inventoryRoutes.js';
import stockRoutes from './routes/stock/stockRoutes.js';
import configRoutes from './routes/config/configRoutes.js';

// 🔧 CORS Configuration
const corsOptions = {
  // Replace with your actual frontend URL (e.g., http://localhost:5173 for Vite)
  origin: ["http://localhost:5173", "http://localhost:5000"], // Added localhost:5000 for Electron
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Client-Type", "x-app-session"], // Added X-Client-Type
  credentials: true, // Crucial if you use Cookies for Auth
};


dotenv.config();
const app = express();


app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


// Main Entry for Auth APIs
app.use('/api/auth', authRoutes);
app.use('/api/admin/clients', clientRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/config', configRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'APL Core Server is Healthy' });
});

export default app;