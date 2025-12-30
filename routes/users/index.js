import express from 'express';
import { userController } from '../../Controllers/userController.js';

const router = express.Router();


router.post('/test-registration', userController.registerForTest);
router.post('/test-unregistration', userController.unregisterForTest);
router.get('/registrations/:email', userController.getRegisteredTests);
router.post('/test-submission', userController.submitTest);
router.post('/submitted-tests', userController.getSubmittedTests);


export default router;