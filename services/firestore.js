import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


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
     * Get a reference to a template document
     * @param {string} templateId - The ID of the template
     * @returns {FirebaseFirestore.DocumentReference}
     */
    #getTemplateDocument(templateId) {
        return db.collection('templates').doc(templateId);
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
                createdAt: questionData.createdAt || Date.now(),
                updatedAt: Date.now()
            };
            
            // Let Firestore generate the ID
            const docRef = await db.collection('questions').add(documentData);
            
            // Update the document data with the generated ID
            documentData._id = docRef.id; //updates local varibale not the firestore document
            
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
                updatedAt: Date.now()
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
    
    /**
     * Creates a new template in the database
     * @param {Object} templateData - The template data to store
     * @returns {Promise<Object>} - The created template document
     */
    async createTemplate(templateData) {
        try {
            // Generate 13-digit Unix timestamps
            const currentTime = Date.now();
            
            // Prepare the document data
            const documentData = {
                ...templateData,
                createdAt: currentTime,
                updatedAt: currentTime
            };
            
            // Let Firestore generate the ID
            const docRef = await db.collection('templates').add(documentData);
            
            // Update the document data with the generated ID
            documentData._id = docRef.id;
            
            return documentData;
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }
    
    /**
     * Gets a template by ID
     * @param {string} templateId - The ID of the template to retrieve
     * @returns {Promise<Object>} - The template document
     */
    async getTemplateById(templateId) {
        try {
            const docRef = this.#getTemplateDocument(templateId);
            const snapshot = await docRef.get();
            
            if (!snapshot.exists) {
                throw new Error('Template not found');
            }
            
            return { ...snapshot.data(), _id: snapshot.id };
        } catch (error) {
            console.error('Error getting template:', error);
            throw error;
        }
    }
    
    /**
     * Lists templates with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of template documents
     */
    async listTemplates(filters = {}) {
        try {
            let query = db.collection('templates');
            
            // Add filters if provided
            if (filters.difficulty) {
                query = query.where('difficulty', '==', filters.difficulty);
            }
            
            // Execute the query
            const snapshot = await query.get();
            
            // Format the results
            let documents = [];
            snapshot.forEach(doc => {
                documents.push({ ...doc.data(), _id: doc.id });
            });
            
            // Filter by subject if provided (can't do this in query because subject is an array)
            if (filters.subject) {
                documents = documents.filter(doc => 
                    doc.subject && doc.subject.includes(filters.subject)
                );
            }
            
            return { documents };
        } catch (error) {
            console.error('Error listing templates:', error);
            throw error;
        }
    }
    
    /**
     * Updates a template by ID
     * @param {string} templateId - The ID of the template to update
     * @param {Object} templateData - The updated template data
     * @returns {Promise<Object>} - The updated template document
     */
    async updateTemplate(templateId, templateData) {
        try {
            // Generate 13-digit Unix timestamp for update time
            const currentTime = Date.now();
            
            // Update the document in Firestore
            const updatedData = {
                ...templateData,
                updatedAt: currentTime
            };
            
            const docRef = this.#getTemplateDocument(templateId);
            await docRef.update(updatedData);
            
            // Get the updated document
            return this.getTemplateById(templateId);
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    }
    
    /**
     * Deletes a template by ID
     * @param {string} templateId - The ID of the template to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteTemplate(templateId) {
        try {
            const docRef = this.#getTemplateDocument(templateId);
            await docRef.delete();
            return true;
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }
}

const firestore = new FirestoreService();
export default firestore;
