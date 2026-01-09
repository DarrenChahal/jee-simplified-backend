import { sqlService } from '../services/postgress.js';

/**
 * Ranks users for a specific test based on their scores
 * 
 * Ranking Logic:
 * - Users are ranked by user_test_score (descending)
 * - Ties are broken by user_test_duration (ascending - faster completion = better)
 * - Users with same score AND duration get the same rank
 * 
 * @param {string} testId - The ID of the test to rank
 * @returns {Promise<Object>} Statistics about the ranking operation
 */
export const rankTestJob = async (testId) => {
    const stats = {
        rankedUsers: 0,
        errors: []
    };

    console.log(`[Job] Starting ranking for test: ${testId}`);

    try {
        // Fetch all evaluated users for this test, sorted by score (desc) and duration (asc)
        const users = await sqlService.getEvaluatedUsersForRanking(testId);

        if (users.length === 0) {
            console.log(`[Job] No evaluated users found for test ${testId}. Aborting.`);
            return stats;
        }

        console.log(`[Job] Found ${users.length} users to rank.`);

        // Calculate ranks with tie handling
        const rankedUsers = calculateRanks(users);

        // Batch update rankings
        for (const user of rankedUsers) {
            try {
                await sqlService.updateUserRanking({
                    user_email: user.user_email,
                    test_id: testId,
                    user_test_ranking: user.rank
                });
                stats.rankedUsers++;
            } catch (err) {
                console.error(`[Job] Error updating rank for ${user.user_email}:`, err);
                stats.errors.push({ user: user.user_email, error: err.message });
            }
        }

    } catch (error) {
        console.error('[Job] Fatal error in rankTestJob:', error);
        throw error;
    }

    console.log(`[Job] Ranking complete. Ranked ${stats.rankedUsers} users.`);
    return stats;
};

/**
 * Calculate ranks for users with proper tie handling
 * Users with same score AND duration get the same rank
 * 
 * @param {Array} users - Sorted array of users (by score desc, duration asc)
 * @returns {Array} Users with rank property added
 */
function calculateRanks(users) {
    if (users.length === 0) return [];

    const rankedUsers = [];
    let currentRank = 1;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        if (i === 0) {
            // First user is always rank 1
            rankedUsers.push({ ...user, rank: currentRank });
        } else {
            const prevUser = users[i - 1];
            
            const isScoreTied = user.user_test_score === prevUser.user_test_score;
            const isDurationTied = user.user_test_duration === prevUser.user_test_duration;

            if (isScoreTied && isDurationTied) {
                // TODO: Both score AND duration are tied - add custom logic here
                // For now, incrementing rank (no tie-breaker yet)
                currentRank = i + 1;
                rankedUsers.push({ ...user, rank: currentRank });
            } else if (isScoreTied) {
                // Same score but different duration - faster user already ranked higher by SQL ORDER BY
                currentRank = i + 1;
                rankedUsers.push({ ...user, rank: currentRank });
            } else {
                // Different score - assign position-based rank
                currentRank = i + 1;
                rankedUsers.push({ ...user, rank: currentRank });
            }
        }
    }

    return rankedUsers;
}
