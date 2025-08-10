import express from 'express';
import bodyParser from 'body-parser';
import { handleClerkWebhook } from '../../Controllers/clerkController.js';

const router = express.Router();

// Use raw body parser ONLY for this route (before any express.json middleware)
router.post(
  '/',
  bodyParser.raw({ type: 'application/json' }), // important for svix verification
  handleClerkWebhook
);

export default router;
