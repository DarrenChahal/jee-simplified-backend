import express from 'express';
import { cronController } from '../../Controllers/cronController.js';

const router = express.Router();

// POST /api/cron/sync-status 
router.post('/sync-status', cronController.syncTestStatus);





export default router;
