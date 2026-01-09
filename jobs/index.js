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
}

const jobs = new Jobs();
export default jobs;
