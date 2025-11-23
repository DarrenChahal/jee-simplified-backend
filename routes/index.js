import express from 'express';
import questionRoutes from './questions/index.js';
import answerRoutes from './answers/index.js';
import templateRoutes from './templates/index.js';
import testRoutes from './tests/index.js';
import userRoutes from './users/index.js';
import systemRoutes from './system/index.js';
const router = express.Router();

// Register route modules
router.use('/questions', questionRoutes);
router.use('/answers', answerRoutes);
router.use('/templates', templateRoutes);
router.use('/tests', testRoutes);
router.use('/users', userRoutes);
router.use('/system', systemRoutes); 

// Add more route modules here as the application grows
// Example: router.use('/users', userRoutes);

export default router;
