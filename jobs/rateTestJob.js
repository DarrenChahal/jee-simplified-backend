import { sqlService } from '../services/postgress.js';

/**
 * Calculates and updates user ratings for a specific test
 * 
 * Rating Algorithm:
 * - Base rating = 0 for new users
 * - z-score normalization: z = (score - mean) / std_dev
 * - Expected performance: expected = rating / 400
 * - Performance delta: delta = z - expected
 * - Rating change: clamp(30 * delta, -50, +50)
 * - New rating: old_rating + rating_change
 * 
 * @param {string} testId - The ID of the test to rate
 * @returns {Promise<Object>} Statistics about the rating operation
 */
export const rateTestJob = async (testId) => {
    // Normalize test ID to string for consistency
    testId = String(testId);
    
    const stats = {
        ratedUsers: 0,
        errors: []
    };

    console.log(`[Job] Starting rating calculation for test: ${testId}`);

    try {
        // Fetch all ranked users with their scores
        const users = await sqlService.getRankedUsersForRating(testId);

        if (users.length === 0) {
            console.log(`[Job] No ranked users found for test ${testId}. Aborting.`);
            return stats;
        }

        console.log(`[Job] Found ${users.length} users to rate.`);

        // Calculate test statistics
        const scores = users.map(u => u.user_test_score || 0);
        const mean = calculateMean(scores);
        const stdDev = calculateStdDev(scores, mean);

        console.log(`[Job] Test statistics - Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`);

        // Handle edge case: small cohort or zero variance
        if (users.length < 30 || stdDev < 0.01) {
            console.warn(`[Job] Small cohort (${users.length}) or low variance (${stdDev}). Using default statistics.`);
            // Could use historical mean/std here if available
        }

        // Calculate ratings for each user
        for (const user of users) {
            try {
                const oldRating = user.previous_rating || 0; // Default to 0 for new users
                const score = user.user_test_score || 0;

                // Step 1: Normalize performance (z-score)
                let z = stdDev > 0 ? (score - mean) / stdDev : 0;
                z = clamp(z, -2.5, 2.5);

                // Step 2: Expected performance from rating
                const expected = oldRating / 400;

                // Step 3: Performance delta
                const delta = z - expected;

                // Step 4: Compute rating change
                const ratingChange = Math.round(clamp(30 * delta, -50, 50));

                // Step 5: Update rating (floor at 0)
                let newRating = oldRating + ratingChange;
                
                // Ensure rating never falls below 0
                if (newRating < 0) {
                    newRating = 0;
                }

                // Update database
                await sqlService.updateUserRating({
                    user_email: user.user_email,
                    test_id: testId,
                    user_rating_change: ratingChange,
                    user_rating_post_test: newRating
                });

                stats.ratedUsers++;
                console.log(`[Job] Rated ${user.user_email}: ${oldRating} → ${newRating} (${ratingChange > 0 ? '+' : ''}${ratingChange})`);

            } catch (err) {
                console.error(`[Job] Error rating user ${user.user_email}:`, err);
                stats.errors.push({ user: user.user_email, error: err.message });
            }
        }

    } catch (error) {
        console.error('[Job] Fatal error in rateTestJob:', error);
        throw error;
    }

    console.log(`[Job] Rating complete. Rated ${stats.ratedUsers} users.`);
    return stats;
};

/**
 * Calculate mean of an array of numbers
 */
function calculateMean(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStdDev(values, mean) {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
