import database from '../services/database.js';
import { validateAnswer } from '../validators/answerValidator.js';
import { pubsubPublisher } from '../helpers/pubsubPublisher.js';    
import config from '../config/prod.js';

const pubsubPublisher = new pubsubPublisher(
    config.pubsub.answerWrite.project_id,
    config.pubsub.answerWrite.topic_name
);

/**
 * Controller for handling answer-related endpoints
 */
export const answerController = {
    /**
     * Create a new answer
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    createAnswer: async (req, res) => {
        try {
            const answerData = req.body;
            
            // Validate answer data
            const validation = validateAnswer(answerData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            
            const messageId = await pubsubPublisher.publishEvent('answer_create', answerData);
            console.info(`Published answer_create event with messageId: ${messageId}`);

            // // Create answer in database
            // const result = await database.createAnswer(answerData);
            
            // return res.status(201).json({
            //     success: true,
            //     message: 'Answer created successfully',
            //     data: result
            // });
            
            return res.status(202).json({
                success: true,
                message: 'Answer creation event queued',
                messageId
            });
        } catch (error) {
            console.error('Error in createAnswer controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to queue answer creation',
                error: error.message
            });
        }
    },
    
    /**
     * Get an answer by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getAnswer: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Answer ID is required'
                });
            }
            
            const answer = await database.getAnswerById(id);
            
            return res.status(200).json({
                success: true,
                data: answer
            });
        } catch (error) {
            console.error('Error in getAnswer controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get answer',
                error: error.message
            });
        }
    },
    
    /**
     * List answers with optional filters
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    listAnswers: async (req, res) => {
        try {
            // Extract filter parameters from query
            const { question_id, user_id, verdict } = req.query;
            
            // Build filters object
            const filters = {};
            if (question_id) filters.question_id = question_id;
            if (user_id) filters.user_id = user_id;
            if (verdict) filters.verdict = verdict;
            
            // Get answers with filters
            const answers = await database.listAnswers(filters);
            
            return res.status(200).json({
                success: true,
                data: answers
            });
        } catch (error) {
            console.error('Error in listAnswers controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to list answers',
                error: error.message
            });
        }
    },
    
    /**
     * Update an answer by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    updateAnswer: async (req, res) => {
        try {
            const { id } = req.params;
            const answerData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Answer ID is required'
                });
            }
            
            // Validate answer data
            const validation = validateAnswer(answerData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            
            const messageId = await pubsubPublisher.publishEvent('answer_update', answerData, id);
            console.info(`Published answer_update event with messageId: ${messageId}`);
            
            // // Update answer in database
            // const result = await database.updateAnswer(id, answerData);
            
            // return res.status(200).json({
            //     success: true,
            //     message: 'Answer updated successfully',
            //     data: result
            // });
            
            return res.status(202).json({
                    success: true,
                message: 'Answer update event queued',
                messageId
            });
        } catch (error) {
            console.error('Error in updateAnswer controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to queue answer update',
                error: error.message
            });
        }
    },
    
    /**
     * Delete an answer by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    deleteAnswer: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Answer ID is required'
                });
            }
            
            // Delete answer from database
            await database.deleteAnswer(id);
            
            return res.status(200).json({
                success: true,
                message: 'Answer deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteAnswer controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete answer',
                error: error.message
            });
        }
    },

    processAnswerWrite: async (req, res) => {
        try {
            // Pub/Sub push messages are received in a standard format.
            const pubsubMessage = req.body.message;
            if (!pubsubMessage || !pubsubMessage.data) {
                return res.status(400).json({ success: false, message: 'Invalid Pub/Sub message format' });
            }
            const messageData = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
            const { eventType, payload } = messageData;

            // Determine the operation to perform based on eventType
            let result;
            if (eventType === 'answer_create') {
                result = await database.createAnswer(payload);
            } else if (eventType === 'answer_update') {
                const { id, ...updateData } = payload;
                result = await database.updateAnswer(id, updateData);
            } else {
                return res.status(400).json({ success: false, message: 'Unknown event type' });
            }

            return res.status(200).json({
                success: true,
                message: 'Answer processed successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in processAnswerWrite controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to process answer write',
                error: error.message
            });
        }
    }
};
