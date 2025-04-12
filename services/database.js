import firestore from './firestore.js';

class DatabaseService {
    /**
     * Creates a new question in the database
     * @param {Object} questionData - The question data to store
     * @returns {Promise<Object>} - The created question document
     */
    async createQuestion(questionData) {
        return firestore.createQuestion(questionData);
    }
    
    /**
     * Gets a question by ID
     * @param {string} questionId - The ID of the question to retrieve
     * @returns {Promise<Object>} - The question document
     */
    async getQuestionById(questionId) {
        return firestore.getQuestionById(questionId);
    }
    
    /**
     * Lists questions with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of question documents
     */
    async listQuestions(filters = {}) {
        return firestore.listQuestions(filters);
    }
    
    /**
     * Updates a question by ID
     * @param {string} questionId - The ID of the question to update
     * @param {Object} questionData - The updated question data
     * @returns {Promise<Object>} - The updated question document
     */
    async updateQuestion(questionId, questionData) {
        return firestore.updateQuestion(questionId, questionData);
    }
    
    /**
     * Deletes a question by ID
     * @param {string} questionId - The ID of the question to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteQuestion(questionId) {
        return firestore.deleteQuestion(questionId);
    }
    
    // Answer-related methods
    async createAnswer(answerData) {
        return firestore.createAnswer(answerData);
    }

    async getAnswerById(id) {
        return firestore.getAnswerById(id);
    }

    async listAnswers(filters = {}) {
        return firestore.listAnswers(filters);
    }

    async updateAnswer(id, answerData) {
        return firestore.updateAnswer(id, answerData);
    }

    async deleteAnswer(id) {
        return firestore.deleteAnswer(id);
    }
    
    // Template-related methods
    /**
     * Creates a new template in the database
     * @param {Object} templateData - The template data to store
     * @returns {Promise<Object>} - The created template document
     */
    async createTemplate(templateData) {
        return firestore.createTemplate(templateData);
    }
    
    /**
     * Gets a template by ID
     * @param {string} templateId - The ID of the template to retrieve
     * @returns {Promise<Object>} - The template document
     */
    async getTemplateById(templateId) {
        return firestore.getTemplateById(templateId);
    }
    
    /**
     * Lists templates with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of template documents
     */
    async listTemplates(filters = {}) {
        return firestore.listTemplates(filters);
    }
    
    /**
     * Updates a template by ID
     * @param {string} templateId - The ID of the template to update
     * @param {Object} templateData - The updated template data
     * @returns {Promise<Object>} - The updated template document
     */
    async updateTemplate(templateId, templateData) {
        return firestore.updateTemplate(templateId, templateData);
    }
    
    /**
     * Deletes a template by ID
     * @param {string} templateId - The ID of the template to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteTemplate(templateId) {
        return firestore.deleteTemplate(templateId);
    }
}

const database = new DatabaseService();
export default database;
