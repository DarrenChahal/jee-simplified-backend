import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


// Initialize Firestore
const db = new Firestore({
    projectId: process.env.GCLOUD_PROJECT_ID,
    databaseId: process.env.DATABASE_ID
});

// Verify connection
db.collection('_health_check').doc('test').get()
    .then(() => console.log('Firestore connection verified successfully'))
    .catch(error => console.error('Firestore connection error:', error.message));

class FirestoreService {
    /**
     * Get a reference to a question document
     * @param {string} questionId - The ID of the question
     * @param {Object} questionData - Optional question data to determine location
     * @returns {FirebaseFirestore.DocumentReference}
     */
    #getQuestionDocument(questionId, questionData = null) {
        // If this is a mock test question, use the specific path
        if (questionData && 
            questionData.origin && 
            questionData.origin.type === 'mock' && 
            questionData.institute && 
            questionData.origin.test_id) {
            return db.collection(`institutes/${questionData.institute}/test_questions/${questionData.origin.test_id}/questions`).doc(questionId);
        }
        
        // Otherwise use the main questions collection
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
     * Get a reference to a test document
     * @param {string} testId - The ID of the test
     * @returns {FirebaseFirestore.DocumentReference}
     * @private
     */
    #getTestDocument(testId) {
        return db.collection('tests').doc(testId);
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
                created_at: questionData.created_at || Date.now(),
                updated_at: questionData.updated_at || Date.now()
            };

            let docRef;
            
            // If this is a mock test question, store it in the specific path
            if (documentData.origin && 
                documentData.origin.type === 'mock' && 
                documentData.institute && 
                documentData.origin.test_id) {
                const collectionPath = `institutes/${documentData.institute}/test_questions/${documentData.origin.test_id}/questions`;
                docRef = await db.collection(collectionPath).add(documentData);
            } else {
                // Otherwise store in the main questions collection
                docRef = await db.collection('questions').add(documentData);
            }
            
            // Update the document data with the generated ID
            documentData._id = docRef.id; //updates local variable not the firestore document
            
            return documentData;
        } catch (error) {
            console.error('Error creating question:', error);
            throw error;
        }
    }
    
    /**
     * Gets a question by ID
     * @param {string} questionId - The ID of the question to retrieve
     * @param {Object} options - Optional parameters (institute, testId)
     * @returns {Promise<Object>} - The question document
     */
    async getQuestionById(questionId, options = {}) {
        try {
            let docRef;
            
            // If we have institute and testId, check the mock test questions collection first
            if (options.institute && options.test_id) {
                const mockPath = `institutes/${options.institute}/test_questions/${options.test_id}/questions`;
                docRef = db.collection(mockPath).doc(questionId);
                const mockSnapshot = await docRef.get();
                
                if (mockSnapshot.exists) {
                    return { ...mockSnapshot.data(), _id: mockSnapshot.id };
                }
            }
            
            // If not found or no options provided, check the main questions collection
            docRef = db.collection('questions').doc(questionId);
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
            let documents = [];
            
            // If we're searching for mock test questions and have institute and testId
            if (filters.origin === 'mock' && filters.institute && filters.test_id) {
                const collectionPath = `institutes/${filters.institute}/test_questions/${filters.test_id}/questions`;
                let query = db.collection(collectionPath);
                
                // Apply filters that work on both collections
                if (filters.difficulty) {
                    query = query.where('difficulty', '==', filters.difficulty);
                }
                
                const mockSnapshot = await query.get();
                mockSnapshot.forEach(doc => {
                    documents.push({ ...doc.data(), _id: doc.id });
                });
                
                return { documents };
            }
            
            // Otherwise, search the main questions collection
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
            
            const docRef = this.#getQuestionDocument(questionId, questionData);
            await docRef.update(updatedData);
            
            // Get the updated document
            const options = {};
            if (questionData.institute && questionData.origin && questionData.origin.test_id) {
                options.institute = questionData.institute;
                options.test_id = questionData.origin.test_id;
            }
            
            return this.getQuestionById(questionId, options);
        } catch (error) {
            console.error('Error updating question:', error);
            throw error;
        }
    }
    
    /**
     * Deletes a question by ID
     * @param {string} questionId - The ID of the question to delete
     * @param {Object} questionData - Optional question data to determine location
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteQuestion(questionId, questionData = null) {
        try {
            const docRef = this.#getQuestionDocument(questionId, questionData);
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
    
    /**
     * Creates a new test in the database
     * @param {Object} testData - The test data to store
     * @returns {Promise<Object>} - The created test document
     */
    async createTest(testData) {
        try {
            // Set institute default if not provided
            const institute = testData.institute || "jee-simplified";
            
            // Prepare document data with all required fields
            const documentData = {
                ...testData,
                created_at: testData.created_at || Date.now(),
                updated_at: testData.updated_at || Date.now(),
                are_questions_public: testData.are_questions_public !== undefined ? testData.are_questions_public : false,
                institute: institute,
                registered_count: testData.registered_count || 0,
                test_pattern: testData.test_pattern || 'none'
            };
            
            // Create document and get the reference
            const docRef = await db.collection('tests').add(documentData);
            const testId = docRef.id;
            
            // Add bucket path and questions collection path to the test document
            const bucketPath = `test_questions_attachments/${institute}/${testId}`;
            await docRef.update({ 
                bucket_path: bucketPath,
                questions_collection_name: `institutes/${institute}/test_questions/${testId}/questions`
            });
            
            // Get the updated document
            const updatedDoc = await docRef.get();
            return { ...updatedDoc.data(), _id: testId };
            
        } catch (error) {
            console.error('Error creating test:', error);
            throw error;
        }
    }
    
    /**
     * Gets a test by ID
     * @param {string} testId - The ID of the test to retrieve
     * @returns {Promise<Object>} - The test document
     */
    async getTestById(testId) {
        try {
            const docRef = this.#getTestDocument(testId);
            const snapshot = await docRef.get();
            
            if (!snapshot.exists) {
                throw new Error('Test not found');
            }
            
            return { ...snapshot.data(), _id: snapshot.id };
        } catch (error) {
            console.error('Error getting test:', error);
            throw error;
        }
    }
    
    /**
     * Lists tests with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of test documents
     */
    async listTests(filters = {}) {
        try {
            let query = db.collection('tests');
            
            // Add filters if provided
            if (filters.subjects) {
                query = query.where('subjects', 'array-contains', filters.subjects);
            }
            
            if (filters.difficulty) {
                query = query.where('difficulty', '==', filters.difficulty);
            }
            
            if (filters.institute) {
                query = query.where('institute', '==', filters.institute);
            }
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
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
            console.error('Error listing tests:', error);
            throw error;
        }
    }
    
    /**
     * Updates a test by ID
     * @param {string} testId - The ID of the test to update
     * @param {Object} testData - The updated test data
     * @returns {Promise<Object>} - The updated test document
     */
    async updateTest(testId, testData) {
        try {
            // Update the document in Firestore
            const updatedData = {
                ...testData,
                updated_at: Date.now()
            };
            
            const docRef = this.#getTestDocument(testId);
            await docRef.update(updatedData);
            
            // Get the updated document
            return this.getTestById(testId);
        } catch (error) {
            console.error('Error updating test:', error);
            throw error;
        }
    }
    
    /**
     * Deletes a test by ID
     * @param {string} testId - The ID of the test to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteTest(testId) {
        try {
            const docRef = this.#getTestDocument(testId);
            await docRef.delete();
            
            return true;
        } catch (error) {
            console.error('Error deleting test:', error);
            throw error;
        }
    }
}

const firestore = new FirestoreService();
export default firestore;
