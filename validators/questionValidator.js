import { z } from 'zod';
import { SUBJECTS, CLASS_LEVELS, DIFFICULTY_LEVELS, ORIGIN_TYPES, ANSWER_TYPES, TEST_TYPES } from '../constants.js';

// Test info schema
const testInfoSchema = z.object({
  test_type: z.enum(TEST_TYPES),
  test_id: z.string().min(1, 'Test ID is required')
});

// Answer metadata schemas for different types
const inputAnswerSchema = z.object({
  answer_type: z.literal('input'),
  correct_answer: z.string().min(1, 'Correct answer is required'),
  options: z.array(z.string()).optional().default([])
});

const singleSelectAnswerSchema = z.object({
  answer_type: z.literal('single-select'),
  options: z.array(z.string()).min(2, 'Single-select questions must have at least 2 options'),
  correct_option: z.number().int().min(0, 'Correct option index must be provided')
});

const multiSelectAnswerSchema = z.object({
  answer_type: z.literal('multi-select'),
  options: z.array(z.string()).min(2, 'Multi-select questions must have at least 2 options'),
  correct_options: z.array(z.number().int().min(0)).min(1, 'At least one correct option must be provided')
});

// Combine answer schemas with discriminated union
const answerMetadataSchema = z.discriminatedUnion('answer_type', [
  inputAnswerSchema,
  singleSelectAnswerSchema,
  multiSelectAnswerSchema
]);

// Base question schema
const baseQuestionSchema = z.object({
  _id: z.string(),
  subject: z.enum(SUBJECTS, {
    errorMap: () => ({ message: `Subject must be one of: ${SUBJECTS.join(', ')}` })
  }),
  for_class: z.enum(CLASS_LEVELS, {
    errorMap: () => ({ message: `Class level must be one of: ${CLASS_LEVELS.join(', ')}` })
  }),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(DIFFICULTY_LEVELS, {
    errorMap: () => ({ message: `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}` })
  }),
  origin: z.enum(ORIGIN_TYPES, {
    errorMap: () => ({ message: `Origin must be one of: ${ORIGIN_TYPES.join(', ')}` })
  }),
  test_info: z.array(testInfoSchema).nullable(),
  question_text: z.string().min(1, 'Question text is required'),
  question_attachments: z.array(z.string().url('Question attachment must be a valid URL')).optional().default([]),
  answer_metadata: answerMetadataSchema,
  tags: z.array(z.string()).optional().default([]),
  created_by: z.string().email('Created by must be a valid email'),
  answer_attachments: z.record(z.string(), z.string().url('Answer attachment must be a valid URL')).optional().default({}),
  createdAt: z.string().datetime('Created at must be a valid ISO datetime'),
  updatedAt: z.string().datetime('Updated at must be a valid ISO datetime').optional()
});

// Add refinement for test_info validation based on origin
const questionSchema = baseQuestionSchema.refine(
  (data) => {
    if (data.origin === 'mock_test' || data.origin === 'prev_year') {
      return data.test_info !== null && Array.isArray(data.test_info) && data.test_info.length > 0;
    }
    return data.test_info === null;
  },
  {
    message: (data) => 
      data.origin === 'platform' 
        ? 'Test info must be null for platform questions'
        : 'Test info is required for mock_test or prev_year questions',
    path: ['test_info']
  }
);

/**
 * Validates question data before storing in the database using Zod
 * @param {Object} questionData - The question data to validate
 * @returns {Object} - Object with isValid flag and error messages if any
 */
export function validateQuestion(questionData) {
  try {
    const result = questionSchema.safeParse(questionData);
    
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
    console.error('Validation error:', error);
    return {
      isValid: false,
      errors: [`An unexpected error occurred during validation: ${error.message}`]
    };
  }
}
