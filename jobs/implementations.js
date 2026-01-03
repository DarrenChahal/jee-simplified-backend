import database from '../services/database.js';

/**
 * Activates tests that are scheduled to start
 * @returns {Promise<Object>} Stats about activated tests
 */
export async function activateScheduledTestsImpl() {
    const stats = {
        activatedCount: 0,
        activatedTestIds: [],
        errors: []
    };

    try {
        // Get all scheduled tests
        const result = await database.listTests({ status: 'scheduled' });
        const scheduledTests = result.documents || [];

        if (scheduledTests.length === 0) {
            return stats;
        }

        const now = Date.now();

        for (const test of scheduledTests) {
            // Check if test start time has passed
            if (test.test_date && test.test_date <= now) {
                try {
                    await database.updateTest(test._id, { 
                        status: 'live',
                        updated_at: now
                    });
                    stats.activatedCount++;
                    stats.activatedTestIds.push(test._id);
                    console.log(`[Job] Activated test: ${test.title} (${test._id})`);
                } catch (err) {
                    console.error(`[Job] Failed to activate test ${test._id}:`, err);
                    stats.errors.push({ testId: test._id, error: err.message });
                }
            }
        }
    } catch (error) {
        console.error('[Job] Error in activateScheduledTests:', error);
        throw error;
    }

    return stats;
}

/**
 * Completes tests that have exceeded their duration
 * @returns {Promise<Object>} Stats about completed tests
 */
export async function completeFinishedTestsImpl() {
    const stats = {
        completedCount: 0,
        completedTestIds: [],
        errors: []
    };

    try {
        // Get all live tests
        const result = await database.listTests({ status: 'live' });
        const liveTests = result.documents || [];

        if (liveTests.length === 0) {
            return stats;
        }

        const now = Date.now();

        for (const test of liveTests) {
            // Calculate end time: test_date + (duration in minutes * 60 * 1000)
            // Default duration to 0 if missing to avoid NaN
            const durationMs = (test.test_duration || 0) * 60 * 1000;
            const endTime = test.test_date + durationMs;

            // Check if test end time has passed
            if (endTime <= now) {
                try {
                    await database.updateTest(test._id, { 
                        status: 'complete',
                        updated_at: now
                    });
                    stats.completedCount++;
                    stats.completedTestIds.push(test._id);
                    console.log(`[Job] Completed test: ${test.title} (${test._id})`);
                } catch (err) {
                    console.error(`[Job] Failed to complete test ${test._id}:`, err);
                    stats.errors.push({ testId: test._id, error: err.message });
                }
            }
        }
    } catch (error) {
        console.error('[Job] Error in completeFinishedTests:', error);
        throw error;
    }

    return stats;
}

/**
 * Evaluates answers for a specific test
 * @param {string} testId - The ID of the test to evaluate
 * @returns {Promise<Object>} Stats about evaluated answers
 */

