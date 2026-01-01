import database from '../services/database.js';
import { validateQuestion } from '../validators/questionValidator.js';
import PubSubPublisher from '../helpers/pubsubPublisher.js';
import config from '../config/prod.js';
import questionCache from '../services/questionCache.js';

const pubsubPublisher = new PubSubPublisher(
    config.pubsub.questionWrite.project_id,
    config.pubsub.questionWrite.topic_name
);

/**
 * Controller for handling question-related endpoints
 */
export const questionController = {
    /**
     * Create a new question
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    createQuestion: async (req, res) => {
        try {
            const questionData = req.body;
            
            // Validate question data
            const validation = validateQuestion(questionData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            const validatedQuestionData = validation.data;
            const messageId = await pubsubPublisher.publishEvent('question_create', validatedQuestionData);
            console.info(`Published question_create event with messageId: ${messageId}`);
            return res.status(202).json({
                success: true,
                message: 'Question creation event queued',
                messageId
            });
        } catch (error) {
            console.error('Error in createQuestion controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to queue question creation',
                error: error.message
            });
        }
    },
    
    /**
     * Get a question by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getQuestion: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Question ID is required'
                });
            }
            
            const question = await database.getQuestionById(id);
            
            return res.status(200).json({
                success: true,
                data: question
            });
        } catch (error) {
            console.error('Error in getQuestion controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get question',
                error: error.message
            });
        }
    },
    
    /**
     * List questions with optional filters
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    listQuestions: async (req, res) => {
        try {
            
            const { subject, for_class, topic, difficulty, origin, test_id } = req.query;
            
            // Build filters object
            const filters = {};
            if (subject) filters.subject = subject;
            if (for_class) filters.for_class = for_class;
            if (topic) filters.topic = topic;
            if (difficulty) filters.difficulty = difficulty;
            if (origin) filters.origin = origin;
            if (test_id) filters.test_id = test_id;

            // Generate cache key
            // We use a stable string representation of the filters
            // Sorting keys to ensure {a:1, b:2} and {b:2, a:1} generate the same key
            const cacheKey = `questions:${JSON.stringify(filters, Object.keys(filters).sort())}`;
            
            // Check cache
            const cachedQuestions = questionCache.get(cacheKey);
            if (cachedQuestions) {
                // console.log(`Question cache hit for: ${cacheKey}`);
                return res.status(200).json({
                    success: true,
                    data: cachedQuestions,
                    source: 'cache'
                });
            }
            
            // console.log(`Question cache miss for: ${cacheKey}`);
            const questions = await database.listQuestions(filters);
            
            // Store in cache
            if (questions) {
                questionCache.set(cacheKey, questions);
            }
            
            return res.status(200).json({
                success: true,
                data: questions,
                source: 'database'
            });
        } catch (error) {
            console.error('Error in listQuestions controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to list questions',
                error: error.message
            });
        }
    },
    
    /**
     * Update a question by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    updateQuestion: async (req, res) => {
        try {
            const { id } = req.params;
            const questionData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Question ID is required'
                });
            }
            
            // Validate question data
            const validation = validateQuestion(questionData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            questionData.id = id;
            const messageId = await pubsubPublisher.publishEvent('question_update', questionData);
            console.info(`Published question_update event with messageId: ${messageId}`)
            // // Update question in database
            // const result = await database.updateQuestion(id, questionData);
            
            // return res.status(200).json({
            //     success: true,
            //     message: 'Question updated successfully',
            //     data: result
            // });
            return res.status(202).json({
                success: true,
                message: 'Question update event queued',
                messageId
            });
        } catch (error) {
            console.error('Error in updateQuestion controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to queue question update',
                error: error.message
            });
        }
    },
    
    /**
     * Delete a question by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    deleteQuestion: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Question ID is required'
                });
            }
            
            // Delete question from database
            await database.deleteQuestion(id);
            
            return res.status(200).json({
                success: true,
                message: 'Question deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteQuestion controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete question',
                error: error.message
            });
        }
    },

    // This endpoint is called by Pub/Sub (via push) to process question events.
    // It will write to the database.
    processQuestionWrite: async (req, res) => {
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
        if (eventType === 'question_create') {
            result = await database.createQuestion(payload);
        } else if (eventType === 'question_update') {
            const { id, ...updateData } = payload;
            result = await database.updateQuestion(id, updateData);
        } else {
            return res.status(400).json({ success: false, message: 'Unknown event type' });
        }

        return res.status(200).json({
            success: true,
            message: 'Question processed successfully',
            data: result
        });
        } catch (error) {
        console.error('Error processing question event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process question event',
            error: error.message
        });
        }
    }
};
