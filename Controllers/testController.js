import database from '../services/database.js';
import { validateTest } from '../validators/testValidator.js';
import jobs from '../jobs/index.js';

/**
 * Controller for handling test-related endpoints
 */
export const testController = {
    /**
     * Create a new test
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    createTest: async (req, res) => {
        try {
            const testData = req.body;
            
            // Validate test data
            const validation = validateTest(testData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            const validatedTestData = validation.data;
            // Create test in database
            const result = await database.createTest(validatedTestData);
            
            return res.status(201).json({
                success: true,
                message: 'Test created successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in createTest controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create test',
                error: error.message
            });
        }
    },
    
    /**
     * Get a test by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getTestById: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Test ID is required'
                });
            }
            
            const test = await database.getTestById(id);
            
            return res.status(200).json({
                success: true,
                data: test
            });
        } catch (error) {
            console.error('Error in getTestById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get test',
                error: error.message
            });
        }
    },
    
    /**
     * Get all tests with optional filters
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getAllTests: async (req, res) => {
        try {
            // Extract filter parameters from query
            const { subjects, difficulty, institute, status, page, limit } = req.query;
            
            // Build filters object
            const filters = {};
            if (subjects) filters.subjects = subjects;
            if (difficulty) filters.difficulty = difficulty;
            if (institute) filters.institute = institute;
            if (status) filters.status = status;

            // Build pagination options
            const options = {};
            if (page) options.page = parseInt(page);
            if (limit) options.limit = parseInt(limit);
            
            // Get tests with filters
            const result = await database.listTests(filters, options);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getAllTests controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to list tests',
                error: error.message
            });
        }
    },
    
    /**
     * Update a test by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    updateTest: async (req, res) => {
        try {
            const { id } = req.params;
            const testData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Test ID is required'
                });
            }
            
            // Always update the updated_at timestamp
            testData.updated_at = Date.now();
            
            // Validate test data
            // const validation = validateTest(testData);
            // if (!validation.isValid) {
            //     return res.status(400).json({
            //         success: false,
            //         errors: validation.errors
            //     });
            // }
            
            // Update test in database
            const result = await database.updateTest(id, testData);
            
            return res.status(200).json({
                success: true,
                message: 'Test updated successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in updateTest controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update test',
                error: error.message
            });
        }
    },
    
    /**
     * Delete a test by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    deleteTest: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Test ID is required'
                });
            }
            
            // Delete test from database
            await database.deleteTest(id);
            
            return res.status(200).json({
                success: true,
                message: 'Test deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteTest controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete test',
                error: error.message
            });
        }
    },

    /**
     * Evaluate a test by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    evaluateTest: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Test ID is required'
                });
            }

            console.log(`Evaluating test ${id}...`);
            
            const stats = await jobs.evaluateTest(id);

            return res.status(200).json({
                success: true,
                message: `Evaluation completed. Processed ${stats.processedUsers} users.`,
                stats
            });
        } catch (error) {
            console.error('Error in evaluateTest controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to evaluate test',
                error: error.message
            });
        }
    }
}; 