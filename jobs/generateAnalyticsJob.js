import { analyticsService } from '../services/analyticsService.js';
import { sqlService } from '../services/postgress.js';

/**
 * Regenerates analytics reports for all users of a test
 * Should be run after Evaluation, Ranking, and Rating are complete.
 * 
 * @param {string} testId 
 * @returns {Promise<Object>} Stats
 */
export const generateAnalyticsJob = async (testId) => {
    testId = String(testId);
    
    const stats = {
        processedUsers: 0,
        errors: []
    };

    console.log(`[Job] Starting analytics regeneration for test: ${testId}`);

    try {
        // Fetch all users who have been evaluated for this test
        // We use getEvaluatedUsersForRanking to get the list of users
        const users = await sqlService.getEvaluatedUsersForRanking(testId);
        
        console.log(`[Job] Found ${users.length} users to generate reports for.`);

        for (const user of users) {
             try {
                 await analyticsService.generateTestReport(testId, user.user_email);
                 stats.processedUsers++;
             } catch (err) {
                 console.error(`[Job] Error generating report for user ${user.user_email}:`, err);
                 stats.errors.push({ user: user.user_email, error: err.message });
             }
        }

    } catch (error) {
        console.error('[Job] Fatal error in generateAnalyticsJob:', error);
        throw error;
    }

    console.log(`[Job] Analytics regeneration complete. Processed ${stats.processedUsers} users.`);
    return stats;
};
