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
}

const database = new DatabaseService();
export default database;
