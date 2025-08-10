import { z } from 'zod';
import { SUBJECTS, DIFFICULTY_LEVELS, INSTITUTES, TEST_STATUS, TEST_PATTERN } from '../constants.js';




// Test schema with Zod
const testSchema = z.object({
    _id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    subjects: z.array(z.string()).min(1, 'At least one subject is required'),
    difficulty: z.enum(DIFFICULTY_LEVELS, {
        errorMap: () => ({ message: `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}` })
    }),
    institute: z.string().default('jee-simplified'),
    status: z.enum(TEST_STATUS, {
        errorMap: () => ({ message: `Status must be one of: ${TEST_STATUS.join(', ')}` })
    }),
    test_pattern: z.enum(TEST_PATTERN, {
        errorMap: () => ({ message: `Test pattern must be one of: ${TEST_PATTERN.join(', ')}` })
    }).default('none'),
    created_by: z.string().email('Created by must be a valid email'),
    created_at: z.number().int().positive().optional(),
    updated_at: z.number().int().positive().optional(),
    test_date: z.number().int().positive('Test date is required'),
    test_duration: z.number().int().positive('Test duration must be a positive number (minutes)'),
    are_questions_public: z.boolean().default(false),
    bucket_path: z.string().optional(), // Auto-generated, so it's optional in validation
    questions_collection_name: z.string().optional(), // Auto-generated, so it's optional in validation
    registered_count: z.number().int().nonnegative().default(0),
    max_score: z.number().nonnegative().optional(),
    questions: z.number().int().nonnegative(),
});

/**
 * Validates test data according to schema requirements using Zod
 * @param {Object} testData - The test data to validate
 * @returns {Object} - Validation result with isValid flag and errors if any
 */
export const validateTest = (testData) => {
    try {
        const result = testSchema.safeParse(testData);
        
        if (result.success) {
            return {
                isValid: true,
                errors: [],
                data: result.data
            };
        } else {
            const errors = result.error.errors.map(err => {
                const path = err.path.join('.');
                return `${path ? path + ': ' : ''}${err.message}`;
            });
            
            return {
                isValid: false,
                errors
            };
        }
    } catch (error) {
        console.error('Validation error:', error);
        return {
            isValid: false,
            errors: [`An unexpected error occurred during validation: ${error.message}`]
        };
    }
}; 