import {z} from 'zod';
import { SUBJECTS, DIFFICULTY_LEVELS } from '../constants.js';

// Define the schema for template validation
const templateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  subject: z.array(z.enum(SUBJECTS, {
    errorMap: () => ({ message: `Each subject must be one of: ${SUBJECTS.join(', ')}` })
  })).min(1, 'At least one subject must be selected'),
  questions: z.number().int().positive('Number of questions must be a positive integer'),
  duration: z.number().int().positive('Duration must be a positive number in minutes'),
  difficulty: z.enum(DIFFICULTY_LEVELS, {
    errorMap: () => ({ message: `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}` })
  })
});

/**
 * Validates template data before storing in the database
 * @param {Object} templateData - The template data to validate
 * @returns {Object} - Object with isValid flag and error messages if any
 */
export function validateTemplate(templateData) {
  try {
    const result = templateSchema.safeParse(templateData);
    
    if (result.success) {
      return {
        isValid: true,
        data: result.data,
        errors: []
      };
    } else {
      const errors = result.error.errors.map(err => {
        const path = err.path.join('.');
        return `${path ? path + ': ' : ''}${err.message}`;
      });
      
      return {
        isValid: false,
        data: null,
        errors
      };
    }
  } catch (error) {
    console.error('Template validation error:', error);
    return {
      isValid: false,
      data: null,
      errors: [`An unexpected error occurred during validation: ${error.message}`]
    };
  }
}

