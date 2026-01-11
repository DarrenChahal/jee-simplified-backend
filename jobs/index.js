import { activateScheduledTestsImpl, completeFinishedTestsImpl } from './implementations.js';
import { evaluateTestJob } from './evaluateTestJob.js';
import { rankTestJob } from './rankTestJob.js';
import { rateTestJob } from './rateTestJob.js';

class Jobs {
    /**
     * Activates tests that are scheduled to start
     * @returns {Promise<Object>} Stats about activated tests
     */
    async activateScheduledTests() {
        return activateScheduledTestsImpl();
    }

    /**
     * Completes tests that have exceeded their duration
     * @returns {Promise<Object>} Stats about completed tests
     */
    async completeFinishedTests() {
        return completeFinishedTestsImpl();
    }

    /**
     * Evaluates answers for a specific test
     * @param {string} testId - The ID of the test to evaluate
     * @returns {Promise<Object>} Stats about evaluated answers
     */
    async evaluateTest(testId) {
        return evaluateTestJob(testId);
    }

    /**
     * Ranks users for a specific test based on their scores
     * @param {string} testId - The ID of the test to rank
     * @returns {Promise<Object>} Stats about ranked users
     */
    async rankTest(testId) {
        return rankTestJob(testId);
    }

    /**
     * Calculates and updates user ratings for a specific test
     * @param {string} testId - The ID of the test to rate
     * @returns {Promise<Object>} Stats about rated users
     */
    async rateTest(testId) {
        return rateTestJob(testId);
    }

    /**
     * Processes a single test through the complete pipeline (Evaluate → Rank → Rate)
     * @param {string} testId - The ID of the test to process
     * @returns {Promise<Object>} Combined stats from all three operations
     */
    async processTest(testId) {
        const { processTestJob } = await import('./processTestJob.js');
        return processTestJob(testId);
    }

    /**
     * Processes multiple completed tests through the pipeline
     * @param {string[]} completedTestIds - Array of test IDs to process
     * @returns {Promise<Object>} Stats about processing results
     */
    async processCompletedTests(completedTestIds) {
        const { processCompletedTestsImpl } = await import('./implementations.js');
        return processCompletedTestsImpl(completedTestIds);
    }
}

const jobs = new Jobs();
export default jobs;
