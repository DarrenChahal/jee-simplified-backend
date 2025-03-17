import { Firestore, Timestamp } from '@google-cloud/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Set the environment variable for Google Cloud authentication
// This is the recommended way to use service account credentials with Google Cloud client libraries
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(projectRoot, 'ivory-sentry-453910-q6-1b8c49f790f5.json');

// Initialize Firestore
const db = new Firestore({
    projectId: process.env.GCLOUD_PROJECT_ID || 'ivory-sentry-453910-q6',
    databaseId: process.env.DATABASE_ID || 'jee-simplified'
});

// Verify connection
db.collection('_health_check').doc('test').get()
    .then(() => console.log('Firestore connection verified successfully'))
    .catch(error => console.error('Firestore connection error:', error.message));

class FirestoreService {
    /**
     * Get a reference to a question document
     * @param {string} questionId - The ID of the question
     * @returns {FirebaseFirestore.DocumentReference}
     */
    #getQuestionDocument(questionId) {
        return db.collection('questions').doc(questionId);
    }
    
    /**
     * Get the next question number from the counter
     * @returns {Promise<number>} - The next question number
     * @private
     */
    async #getNextQuestionNumber() {
        try {
            // Use a transaction to ensure atomicity when incrementing the counter
            const counterRef = db.collection('system').doc('counters');
            
            return await db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                
                let currentNumber = 1; // Start with 1 if counter doesn't exist
                
                if (counterDoc.exists) {
                    const counterData = counterDoc.data();
                    currentNumber = (counterData.lastQuestionNumber || 0) + 1;
                }
                
                // Update the counter
                transaction.set(counterRef, { lastQuestionNumber: currentNumber }, { merge: true });
                
                return currentNumber;
            });
        } catch (error) {
            console.error('Error getting next question number:', error);
            throw error;
        }
    }

    /**
     * Creates a new question in the database
     * @param {Object} questionData - The question data to store
     * @returns {Promise<Object>} - The created question document
     */
    async createQuestion(questionData) {
        try {
            // Get the next question number
            const questionNumber = await this.#getNextQuestionNumber();
            
            // Prepare the document data
            const documentData = {
                ...questionData,
                questionNumber, // Add the auto-incremented question number
                createdAt: questionData.createdAt || Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            
            // Let Firestore generate the ID
            const docRef = await db.collection('questions').add(documentData);
            
            // Update the document data with the generated ID
            documentData._id = docRef.id;
            
            return documentData;
        } catch (error) {
            console.error('Error creating question:', error);
            throw error;
        }
    }
    
    /**
     * Gets a question by ID
     * @param {string} questionId - The ID of the question to retrieve
     * @returns {Promise<Object>} - The question document
     */
    async getQuestionById(questionId) {
        try {
            const docRef = this.#getQuestionDocument(questionId);
            const snapshot = await docRef.get();
            
            if (!snapshot.exists) {
                throw new Error('Question not found');
            }
            
            return { ...snapshot.data(), _id: snapshot.id };
        } catch (error) {
            console.error('Error getting question:', error);
            throw error;
        }
    }
    
    /**
     * Lists questions with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of question documents
     */
    async listQuestions(filters = {}) {
        try {
            let query = db.collection('questions');
            
            // Add filters if provided
            if (filters.subject) {
                query = query.where('subject', '==', filters.subject);
            }
            
            if (filters.for_class) {
                query = query.where('for_class', '==', filters.for_class);
            }
            
            if (filters.topic) {
                query = query.where('topic', '==', filters.topic);
            }
            
            if (filters.difficulty) {
                query = query.where('difficulty', '==', filters.difficulty);
            }
            
            if (filters.origin) {
                query = query.where('origin', '==', filters.origin);
            }
            
            // Execute the query
            const snapshot = await query.get();
            
            // Format the results
            const documents = [];
            snapshot.forEach(doc => {
                documents.push({ ...doc.data(), _id: doc.id });
            });
            
            return { documents };
        } catch (error) {
            console.error('Error listing questions:', error);
            throw error;
        }
    }
    
    /**
     * Updates a question by ID
     * @param {string} questionId - The ID of the question to update
     * @param {Object} questionData - The updated question data
     * @returns {Promise<Object>} - The updated question document
     */
    async updateQuestion(questionId, questionData) {
        try {
            // Update the document in Firestore
            const updatedData = {
                ...questionData,
                updatedAt: Timestamp.now()
            };
            
            const docRef = this.#getQuestionDocument(questionId);
            await docRef.update(updatedData);
            
            // Get the updated document
            return this.getQuestionById(questionId);
        } catch (error) {
            console.error('Error updating question:', error);
            throw error;
        }
    }
    
    /**
     * Deletes a question by ID
     * @param {string} questionId - The ID of the question to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteQuestion(questionId) {
        try {
            const docRef = this.#getQuestionDocument(questionId);
            await docRef.delete();
            return true;
        } catch (error) {
            console.error('Error deleting question:', error);
            throw error;
        }
    }
    

}

const firestore = new FirestoreService();
export default firestore;
