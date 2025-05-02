// dotenv/config is preloaded via the npm script
import express from 'express';
import connectDB from './config/db.js';

connectDB();

const app = express();

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
