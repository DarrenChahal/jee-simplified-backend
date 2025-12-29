import { z } from 'zod';
import { SUBJECTS, CLASS_LEVELS, DIFFICULTY_LEVELS, ORIGIN_TYPES, ANSWER_TYPES, TEST_TYPES, TEST_PATTERN } from '../constants.js';

// Origin schema with discriminated union based on type
const originBaseSchema = z.object({
  type: z.enum(ORIGIN_TYPES),
  exam: z.enum(TEST_PATTERN),
});

const prevYearOriginSchema = originBaseSchema.extend({
  type: z.literal('prev_year'),
  year: z.number().int().positive(),
  session: z.enum(['Jan', 'May']).optional(),
  paper: z.enum(['Paper 1', 'Paper 2']).optional(),
  test_id: z.string().optional(),
});

const mockOriginSchema = originBaseSchema.extend({
  type: z.literal('mock'),
  test_id: z.string(),
});

const platformOriginSchema = originBaseSchema.extend({
  type: z.literal('platform'),
});

const originSchema = z.discriminatedUnion('type', [
  prevYearOriginSchema,
  mockOriginSchema,
  platformOriginSchema,
]);

// Answer schema with discriminated union based on type
const answerBaseSchema = z.object({
  type: z.enum(ANSWER_TYPES),
  solution: z.string().optional(),
});

const inputAnswerSchema = answerBaseSchema.extend({
  type: z.literal('input'),
  correct_answer: z.string().min(1, 'Correct answer is required'),
  options: z.array(z.string()).optional().default([]),
});

const singleChoiceAnswerSchema = answerBaseSchema.extend({
  type: z.literal('single_choice'),
  options: z.array(z.string()).min(2, 'Single-choice questions must have at least 2 options'),
  correct_answer: z.string()
    .transform((val, ctx) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Correct option must be a number',
        });
        return z.NEVER;
      }
      return parsed;
    })
    .refine((val) => val >= 0, {
      message: 'Correct option index must be provided',
    }),
});


const multiChoiceAnswerSchema = answerBaseSchema.extend({
  type: z.literal('multi_choice'),
  options: z.array(z.string()).min(2, 'Multi-choice questions must have at least 2 options'),
  correct_answer: z.array(z.number().int().min(0)).min(1, 'At least one correct option must be provided'),
});

const answerSchema = z.discriminatedUnion('type', [
  inputAnswerSchema,
  singleChoiceAnswerSchema,
  multiChoiceAnswerSchema,
]);

// Question schema
const questionSchema = z.object({
  _id: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)).min(1, 'At least one subject is required'),
  for_class: z.array(z.enum(CLASS_LEVELS)).min(1, 'At least one class level is required'),
  institute: z.string().default('jee-simplified'),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  difficulty: z.enum(DIFFICULTY_LEVELS, {
    errorMap: () => ({ message: `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}` })
  }),
  origin: originSchema,
  question_text: z.string().min(1, 'Question text is required'),
  attachments: z.array(z.string()).optional().default([]),
  answer: answerSchema,
  tags: z.array(z.string()).optional().default([]),
  created_by: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

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
}
