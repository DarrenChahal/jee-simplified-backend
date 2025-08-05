import express from 'express';
import { userController } from '../../Controllers/userController.js';

const router = express.Router();


router.post('/test-registration', userController.registerForTest);


export default router;