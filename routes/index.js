import express from 'express';
import questionRoutes from './questions/index.js';
import answerRoutes from './answers/index.js';

const router = express.Router();

// Register route modules
router.use('/questions', questionRoutes);
router.use('/answers', answerRoutes);

// Add more route modules here as the application grows
// Example: router.use('/users', userRoutes);

export default router;
