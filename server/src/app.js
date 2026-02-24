import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Pointing to the new organized routes folder
import authRoutes from './routes/auth/authRoutes.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);


// Main Entry for Auth APIs
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'APL Core Server is Healthy' });
});

export default app;