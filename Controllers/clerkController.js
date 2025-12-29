import { Webhook } from 'svix';
import { clerkClient } from '@clerk/clerk-sdk-node';
import database from '../services/database.js';
import dotenv from 'dotenv';


dotenv.config();

export const handleClerkWebhook = async (req, res) => {
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(req.body.toString('utf8'), req.headers);

    const { type, data } = evt;

    // Handle new user creation
    if (type === 'user.created') {
      const user_email = data.email_addresses?.[0]?.email_address?.trim();
      if (!user_email) {
        console.error(`No email for Clerk user ${data.id}`);
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const user_name = user_email.split('@')[0];
      await database.createUserFromClerk({
        clerk_user_id: data.id,
        user_email,
        user_name
      });
    }

    // Handle session creation to enforce single active session
    if (type === 'session.created') {
      const userId = data.user_id;

      // Fetch all sessions for this user
      const sessionList = await clerkClient.sessions.getSessionList({ userId });
      const sessions = sessionList?.data || [];
      console.log(`Found ${sessionList} sessions list for user ${userId}`);
      console.log(`Found ${sessions.length} sessions for user ${userId}`);

      if (sessions.length > 1) {
        // Sort by last_active_at if available; else fallback to created_at
        const sorted = sessions.sort(
          (a, b) =>
            new Date(b.last_active_at || b.created_at) -
            new Date(a.last_active_at || a.created_at)
        );

        // Revoke older sessions
        for (let i = 1; i < sorted.length; i++) {
          await clerkClient.sessions.revokeSession(sorted[i].id);
          console.log(`Revoked session ${sorted[i].id} for user ${userId}`);
        }
      }
    }


    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: 'Invalid or failed processing' });
  }
};
