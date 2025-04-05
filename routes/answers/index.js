import express from 'express';
import { answerController } from '../../Controllers/answerController.js';

const router = express.Router();

// answer endpoints
router.post('/', answerController.createAnswer);
router.get('/:id', answerController.getAnswer);
router.get('/', answerController.listAnswers);
router.put('/:id', answerController.updateAnswer);
router.delete('/:id', answerController.deleteAnswer);
router.post('/subscriber', answerController.processAnswerWrite);

//test specfifc asnwer endpoints
router.get('/test/:testId',answerController.getTestAnswers);
router.get('/test/:userId',answerController.getUserAnswers);
router.get('/question/:questionsId',answerController.getQuestionAnswers);

export default router;
