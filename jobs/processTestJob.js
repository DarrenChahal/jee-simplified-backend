import { evaluateTestJob } from './evaluateTestJob.js';
import { rankTestJob } from './rankTestJob.js';
import { rateTestJob } from './rateTestJob.js';
import { generateAnalyticsJob } from './generateAnalyticsJob.js';

/**
 * Orchestrates the complete processing pipeline for a single test
 * Sequentially executes: Evaluate → Rank → Rate → Analytics
 * 
 * This ensures atomic processing where each step uses output from previous steps:
 * - Rank depends on scores from Evaluate
 * - Rate depends on scores and rankings
 * - Analytics depends on all of the above
 * 
 * @param {string} testId - The ID of the test to process
 * @returns {Promise<Object>} Combined statistics from all operations
 */
export const processTestJob = async (testId) => {
    const results = {
        testId,
        evaluation: null,
        ranking: null,
        rating: null,
        analytics: null, // Added analytics stats
        errors: []
    };

    const startTime = Date.now();

    console.log(`[ProcessJob] Starting complete processing for test: ${testId}`);

    try {
        // Step 1: Evaluate - Grade answers and calculate scores
        console.log(`[ProcessJob] Step 1/4: Evaluating test ${testId}...`);
        const evalStartTime = Date.now();
        results.evaluation = await evaluateTestJob(testId);
        results.evaluation.durationMs = Date.now() - evalStartTime;
        console.log(`[ProcessJob] ✓ Evaluation complete (${results.evaluation.durationMs}ms)`);

        // Step 2: Rank - Assign rankings based on scores
        console.log(`[ProcessJob] Step 2/4: Ranking users for test ${testId}...`);
        const rankStartTime = Date.now();
        results.ranking = await rankTestJob(testId);
        results.ranking.durationMs = Date.now() - rankStartTime;
        console.log(`[ProcessJob] ✓ Ranking complete (${results.ranking.durationMs}ms)`);

        // Step 3: Rate - Update user ratings based on performance
        console.log(`[ProcessJob] Step 3/4: Calculating ratings for test ${testId}...`);
        const rateStartTime = Date.now();
        results.rating = await rateTestJob(testId);
        results.rating.durationMs = Date.now() - rateStartTime;
        console.log(`[ProcessJob] ✓ Rating complete (${results.rating.durationMs}ms)`);

        // Step 4: Analytics - Regenerate detailed reports with final data
        console.log(`[ProcessJob] Step 4/4: Regenerating analytics for test ${testId}...`);
        const analyticsStartTime = Date.now();
        results.analytics = await generateAnalyticsJob(testId);
        results.analytics.durationMs = Date.now() - analyticsStartTime;
        console.log(`[ProcessJob] ✓ Analytics generation complete (${results.analytics.durationMs}ms)`);

        results.totalDurationMs = Date.now() - startTime;
        console.log(`[ProcessJob] ✅ Complete processing finished for test ${testId} (${results.totalDurationMs}ms)`);

    } catch (error) {
        results.totalDurationMs = Date.now() - startTime;
        results.errors.push({
            message: error.message,
            stack: error.stack
        });
        console.error(`[ProcessJob] ❌ Error processing test ${testId}:`, error);
        throw error; // Re-throw to let caller handle it
    }

    return results;
};
