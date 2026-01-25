import { validateRegistration, validateEmail, validateTestSubmission, validateSubmittedTestsRequest } from '../validators/userValidator.js';
import database from '../services/database.js';

export const userController = {
    async registerForTest(req, res) {
        try {
            const registrationData = req.body;

            // Validate registration data
            const validation = validateRegistration(registrationData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            const validatedRegistrationData = validation.data;

            // Register user for test in database
            const result = await database.registerForTest(validatedRegistrationData);

            // update the registration count in mongoDb
            const update = await database.addTestRegistration(validatedRegistrationData.test_id);

            return res.status(201).json({
                success: true,
                message: 'User registered for test successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in registerForTest controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register for test',
                error: error.message
            });
        }
    },

    async unregisterForTest(req, res) {
        try {
            const unregistrationData = req.body;

            // Validate registration data
            const validation = validateRegistration(unregistrationData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            const validatedUnregistrationData = validation.data;

            // Register user for test in database
            const result = await database.unregisterForTest(validatedUnregistrationData);

            // update the registration count in mongoDb
            const update = await database.removeTestRegistration(validatedUnregistrationData.test_id);

            return res.status(201).json({
                success: true,
                message: 'User registered for test successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in registerForTest controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register for test',
                error: error.message
            });
        }
    },

    async getRegisteredTests(req, res) {
        try {
            const { email } = req.params;

            // Validate email
            const validation = validateEmail(email);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }

            const tests = await database.getRegisteredTests(email);

            return res.status(200).json({
                success: true,
                data: tests
            });
        } catch (error) {
            console.error('Error in getRegisteredTests controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch registered tests',
                error: error.message
            });
        }
    },

    async submitTest(req, res) {
        try {
            const submissionData = req.body;

            // Validate submission data
            const validation = validateTestSubmission(submissionData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            const validatedSubmissionData = validation.data;

            // Update submission status in database
            const result = await database.submitTest(validatedSubmissionData);
            console.log("Result in submitTest controller",result)
            return res.status(200).json({
                success: true,
                message: 'Test submitted successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in submitTest controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to submit test',
                error: error.message
            });
        }
    },

    async getSubmittedTests(req, res) {
        try {
            const requestData = req.body;

            // Validate request data
            //console.log("Request data in getSubmittedTests controller",requestData)
            const validation = validateSubmittedTestsRequest(requestData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }
            const validatedRequestData = validation.data;

            // Get submitted tests from database
            //const submittedTestIds = await database.getSubmittedTests(validatedRequestData);
            console.log("Submitted test ids ",submittedTestIds)
            return res.status(200).json({
                success: true,
                data: submittedTestIds
            });
        } catch (error) {
            console.error('Error in getSubmittedTests controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch submitted tests',
                error: error.message
            });
        }
    },

    async getUserTestResults(req, res) {
        try {
            const { email } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!email) {
                 return res.status(400).json({
                     success: false,
                     message: "Email is required"
                 });
            }

            // Validate email
            const validation = validateEmail(email);
            if (!validation.isValid) {
                return res.status(400).json({
                     success: false,
                     errors: validation.errors
                });
            }

            const data = await database.getUserTestResults(email, page, limit);

            return res.status(200).json({
                success: true,
                data: data
            });

        } catch (error) {
            console.error('Error in getUserTestResults controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch test results',
                error: error.message
            });
        }
    },

    async getUserDashboard(req, res) {
        try {
            const { identifier } = req.params;

            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message: "User identifier is required"
                });
            }

            // We assume identifier is email for now. 
            // If validation is needed we can reuse validateEmail or similar.
            const dashboardData = await database.getUserDashboard(identifier);
            //console.log("dashboardData", dashboardData);

            return res.status(200).json(dashboardData);
        } catch (error) {
            console.error('Error in getUserDashboard controller:', error);
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard data',
                error: error.message
            });
        }
    },

    async checkAdmin(req, res) {
        try {
            const { email } = req.query;

            // Validate email parameter
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email query parameter is required'
                });
            }

            const validation = validateEmail(email);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
            }

            // Check admin status (with caching)
            const isAdmin = await database.checkAdminStatus(email);

            if (isAdmin === null) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                is_admin: isAdmin
            });
        } catch (error) {
            console.error('Error in checkAdmin controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to check admin status',
                error: error.message
            });
        }
    }
}
