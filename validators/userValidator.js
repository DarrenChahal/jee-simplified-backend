import { z } from 'zod';

const STATUS_VALUES = ['live', 'scheduled', 'complete'];

const registrationSchema = z.object({
  user_id: z.string().uuid({ message: 'user_id must be a valid UUID' }),
  test_id: z.string().regex(/^[a-f\d]{24}$/i, {
    message: 'test_id must be a valid 24-character MongoDB ObjectId',
  }),

  test_duration: z.number().int().positive('test_duration must be a positive integer'),

  test_date: z.number().int().min(1000000000000, 'test_date must be a 13-digit Unix timestamp in ms'),

  status: z.enum(STATUS_VALUES, {
    errorMap: () => ({
      message: `Status must be one of: ${STATUS_VALUES.join(', ')}`,
    }),
  }),

  total_questions: z.number().int().nonnegative('total_questions must be 0 or a positive integer'),
});

export function validateRegistration(registrationData) {
  try {
    const result = registrationSchema.safeParse(registrationData);

    if (result.success) {
      return {
        isValid: true,
        data: result.data,
        errors: [],
      };
    } else {
      const errors = result.error.errors.map(err => {
        const path = err.path.join('.');
        return `${path ? path + ': ' : ''}${err.message}`;
      });

      return {
        isValid: false,
        data: null,
        errors,
      };
    }
  } catch (error) {
    console.error('Registration validation error:', error);
    return {
      isValid: false,
      data: null,
      errors: [`Unexpected error during validation: ${error.message}`],
    };
  }
}
