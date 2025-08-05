import { validateRegistration } from '../validators/userValidator.js';
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
    }
}
