import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import initSchema from './migrations/initSchema.js';

const app = express();

app.use(cors());

const PORT = process.env.PORT || 8080;
app.use(express.json());

await initSchema(); // Initialize database schema

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'JEE Simplified API is running' });
});

// API routes
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});