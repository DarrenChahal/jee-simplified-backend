import express from 'express';
import { questionController } from '../../Controllers/questionController.js';

const router = express.Router();

// Question endpoints
router.post('/', questionController.createQuestion);
router.get('/:id', questionController.getQuestion);
router.get('/', questionController.listQuestions);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);
router.post('/subscriber', questionController.processQuestionWrite);

export default router;
