import { z } from 'zod';
import { ANSWER_STATUS, VERDICT_TYPES, TEST_TYPES, ORIGIN_TYPES } from '../constants.js';

// Test context schema
const solvedDuringTestSchema = z.object({
  test_type: z.enum(TEST_TYPES),
  test_id: z.string().min(1, 'Test ID is required'),
  duration_passed_when_solved: z.number().int().min(0),
  marked_as: z.enum(ANSWER_STATUS)
}).nullable();

// User answer schema for different types
const userAnswerSchema = z.object({
  input: z.string().optional(),
  selected_option: z.number().int().min(0).optional(),
  selected_options: z.array(z.number().int().min(0)).optional()
});

// Main answer schema
const baseAnswerSchema = z.object({
  _id: z.string(),
  question_id: z.string().min(1, 'Question ID is required'),
  user_id: z.string().min(1, 'User ID is required'),
  solved_during_test: solvedDuringTestSchema,
  time_taken: z.number().int().min(0, 'Time taken must be a positive number'),
  answer: userAnswerSchema,
  verdict: z.enum(VERDICT_TYPES),
  analysis_sheet_id: z.string().optional(),
  submittedAt: z.string().datetime('Submitted at must be a valid ISO datetime'),
  question_type: z.enum(['input', 'single-select', 'multi-select'])
});

// Add refinement to ensure answer matches question type
const answerSchema = baseAnswerSchema.refine(
  (data) => {
    // For input type questions
    if (data.question_type === 'input') {
      return typeof data.answer.input === 'string' && 
             data.answer.input.length > 0 &&
             !data.answer.selected_option &&
             !data.answer.selected_options;
    }
    // For single select questions
    if (data.question_type === 'single-select') {
      return typeof data.answer.selected_option === 'number' &&
             !data.answer.input &&
             !data.answer.selected_options;
    }
    // For multi select questions
    if (data.question_type === 'multi-select') {
      return Array.isArray(data.answer.selected_options) &&
             data.answer.selected_options.length > 0 &&
             !data.answer.input &&
             !data.answer.selected_option;
    }
    return false;
  },
  {
    message: (data) => `Answer format does not match question type: ${data.question_type}`,
    path: ['answer']
  }
);

/**
 * Validates answer submission data
 * @param {Object} answerData - The answer submission data to validate
 * @returns {Object} - Object with isValid flag and error messages if any
 */
export function validateAnswer(answerData) {
  try {
    const result = answerSchema.safeParse(answerData);
    
    if (result.success) {
      return {
        isValid: true,
        errors: []
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
    console.error('Answer validation error:', error);
    return {
      isValid: false,
      errors: [`An unexpected error occurred during validation: ${error.message}`]
    };
  }
}
