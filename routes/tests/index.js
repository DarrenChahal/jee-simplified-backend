import express from 'express';
import { testController } from '../../Controllers/testController.js';

const router = express.Router();


router.post('/', testController.createTest);
router.get('/', testController.getAllTests);
router.get('/:id', testController.getTestById);
router.put('/:id', testController.updateTest);
router.delete('/:id', testController.deleteTest);
router.post('/:id/evaluate', testController.evaluateTest);
router.post('/:id/rank', testController.rankTest);
router.post('/:id/rate', testController.rateTest);

export default router;