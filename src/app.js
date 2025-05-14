// dotenv/config is preloaded via the npm script
import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';

connectDB();

const app = express();

app.use(cors());

app.get('/', (req, res) => res.send('API Running'));

app.get('/health', (req, res) => {
    res.status(200).json({
        message: 'Server is running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
