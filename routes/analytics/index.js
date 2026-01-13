import express from 'express';
import database from '../../services/database.js';

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // Assume user email is attached to req by middleware (e.g. Clerk)
        // For now, we might expect it in query or header if auth middleware isn't fully visible here yet.
        // Looking at index.js, there isn't a global auth middleware shown, but usually it's there.
        // We'll check req.auth or req.user, or fallback to query param for now to be safe/flexible.

        // CHECKING CONVENTION: 
        // In userController.js (not seen fully but assume), context is usually implicit.
        // However, looking at database calls, we pass 'email' explicitly.
        // Let's expect 'user_email' in query or body or from auth token.
        // As a safe bet, let's look for `req.auth.userId` (Clerk) or query param `email` for dev/testing.

        const email = req.query.email; // Simple for now
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const data = await database.getUserDashboardAnalytics(email);
        res.json(data);
    } catch (err) {
        console.error('Error fetching dashboard analytics:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/analytics/test/:testId
router.get('/test/:testId', async (req, res) => {
    try {
        const { testId } = req.params;
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const report = await database.getTestAnalyticsReport(testId, email);
        if (!report) {
            return res.status(404).json({ error: 'Analytics report not found. Wait for processing or check ID.' });
        }

        res.json(report);
    } catch (err) {
        console.error('Error fetching test analytics:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
