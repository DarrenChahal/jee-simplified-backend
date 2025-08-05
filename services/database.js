import mongoService from './mongo.js';
import {sqlService} from './postgress.js';

class DatabaseService {
    /**
     * Creates a new question in the database
     * @param {Object} questionData - The question data to store
     * @returns {Promise<Object>} - The created question document
     */
    async createQuestion(questionData) {
        return mongoService.createQuestion(questionData);
    }
    
    /**
     * Gets a question by ID
     * @param {string} questionId - The ID of the question to retrieve
     * @returns {Promise<Object>} - The question document
     */
    async getQuestionById(questionId) {
        return mongoService.getQuestionById(questionId);
    }
    
    /**
     * Lists questions with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of question documents
     */
    async listQuestions(filters = {}) {
        return mongoService.listQuestions(filters);
    }
    
    /**
     * Updates a question by ID
     * @param {string} questionId - The ID of the question to update
     * @param {Object} questionData - The updated question data
     * @returns {Promise<Object>} - The updated question document
     */
    async updateQuestion(questionId, questionData) {
        return mongoService.updateQuestion(questionId, questionData);
    }
    
    /**
     * Deletes a question by ID
     * @param {string} questionId - The ID of the question to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteQuestion(questionId) {
        return mongoService.deleteQuestion(questionId);
    }
    
    // Answer-related methods
    async createAnswer(answerData) {
        return mongoService.createAnswer(answerData);
    }

    async getAnswerById(id) {
        return mongoService.getAnswerById(id);
    }

    async listAnswers(filters = {}) {
        return mongoService.listAnswers(filters);
    }

    async updateAnswer(id, answerData) {
        return mongoService.updateAnswer(id, answerData);
    }

    async deleteAnswer(id) {
        return mongoService.deleteAnswer(id);
    }
    
    // Template-related methods
    /**
     * Creates a new template in the database
     * @param {Object} templateData - The template data to store
     * @returns {Promise<Object>} - The created template document
     */
    async createTemplate(templateData) {
        return mongoService.createTemplate(templateData);
    }
    
    /**
     * Gets a template by ID
     * @param {string} templateId - The ID of the template to retrieve
     * @returns {Promise<Object>} - The template document
     */
    async getTemplateById(templateId) {
        return mongoService.getTemplateById(templateId);
    }
    
    /**
     * Lists templates with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of template documents
     */
    async listTemplates(filters = {}) {
        return mongoService.listTemplates(filters);
    }
    
    /**
     * Updates a template by ID
     * @param {string} templateId - The ID of the template to update
     * @param {Object} templateData - The updated template data
     * @returns {Promise<Object>} - The updated template document
     */
    async updateTemplate(templateId, templateData) {
        return mongoService.updateTemplate(templateId, templateData);
    }
    
    /**
     * Deletes a template by ID
     * @param {string} templateId - The ID of the template to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteTemplate(templateId) {
        return mongoService.deleteTemplate(templateId);
    }
    
    // Test-related methods
    /**
     * Creates a new test in the database
     * @param {Object} testData - The test data to store
     * @returns {Promise<Object>} - The created test document
     */
    async createTest(testData) {
        return mongoService.createTest(testData);
    }
    
    /**
     * Gets a test by ID
     * @param {string} testId - The ID of the test to retrieve
     * @returns {Promise<Object>} - The test document
     */
    async getTestById(testId) {
        return mongoService.getTestById(testId);
    }
    
    /**
     * Lists tests with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of test documents
     */
    async listTests(filters = {}) {
        return mongoService.listTests(filters);
    }
    
    /**
     * Updates a test by ID
     * @param {string} testId - The ID of the test to update
     * @param {Object} testData - The updated test data
     * @returns {Promise<Object>} - The updated test document
     */
    async updateTest(testId, testData) {
        return mongoService.updateTest(testId, testData);
    }
    
    /**
     * Deletes a test by ID
     * @param {string} testId - The ID of the test to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteTest(testId) {
        return mongoService.deleteTest(testId);
    }

    async registerForTest(data) {
        return sqlService.registerForTest(data);
    }
}

const database = new DatabaseService();
export default database;
