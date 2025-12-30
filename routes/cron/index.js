import express from 'express';
import { cronController } from '../../Controllers/cronController.js';

const router = express.Router();

// POST /api/cron/sync-status
router.post('/sync-status', cronController.syncTestStatus);

// POST /api/cron/evaluate-test
router.post('/evaluate-test', cronController.evaluateTest);

export default router;
