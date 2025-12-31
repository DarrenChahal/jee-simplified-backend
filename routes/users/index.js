import express from 'express';
import { userController } from '../../Controllers/userController.js';

const router = express.Router();

console.log("Loading User Routes...");
router.use((req, res, next) => {
    console.log(`User Route Hit: ${req.method} ${req.url}`);
    next();
});


router.post('/test-registration', userController.registerForTest);
router.post('/test-unregistration', userController.unregisterForTest);
router.get('/registrations/:email', userController.getRegisteredTests);
router.post('/test-submission', userController.submitTest);
router.post('/submitted-tests', userController.getSubmittedTests);
router.get('/:identifier/dashboard', userController.getUserDashboard);


export default router;