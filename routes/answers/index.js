import express from 'express';
import { answerController } from '../../Controllers/answerController.js';

const router = express.Router();

// answer endpoints
router.post('/', questionController.submitAnswer);
router.get('/:id', questionController.getAnswer);
router.get('/', questionController.listAnswers);
router.put('/:id', questionController.updateAnswer);
router.delete('/:id', questionController.deleteAnswer);

//test specfifc asnwer endpoints
router.get('/test/:testId',answerController.getTestAnswers);
router.get('/test/:userId',answerController.getUserAnswers);
router.get('/question/:questionsId',answerController.getQuestionAnswers);

export default router;
