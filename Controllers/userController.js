import { validateRegistration, validateEmail } from '../validators/userValidator.js';
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
    }
}
