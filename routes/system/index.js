import express from 'express';
import { systemController } from '../../Controllers/systemController.js';

const router = express.Router();

router.get('/time', systemController.getTime);


export default router;