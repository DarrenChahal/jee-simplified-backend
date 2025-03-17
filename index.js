import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';

const app = express();

app.use(cors());

const PORT = process.env.PORT || 8080;
app.use(express.json());

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