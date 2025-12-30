import { activateScheduledTestsImpl, completeFinishedTestsImpl, evaluateTestImpl } from './implementations.js';

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
        return evaluateTestImpl(testId);
    }
}

const jobs = new Jobs();
export default jobs;
