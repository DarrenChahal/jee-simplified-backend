import { z } from 'zod';

const STATUS_VALUES = ['live', 'scheduled', 'complete'];

const registrationSchema = z.object({
  user_email: z.string().email({ message: 'user_id must be a valid email id' }),
  test_id: z.string().regex(/^[a-f\d]{24}$/i, {
    message: 'test_id must be a valid 24-character MongoDB ObjectId',
  }),

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

export function validateEmail(email) {
  const emailSchema = z.string().email({ message: 'Invalid email format' });
  const result = emailSchema.safeParse(email);

  if (result.success) {
    return { isValid: true, errors: [] };
  } else {
    return {
      isValid: false,
      errors: result.error.errors.map(err => err.message)
    };
  }
}

export function validateTestSubmission(submissionData) {
  try {
    const result = registrationSchema.safeParse(submissionData);

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
    console.error('Test submission validation error:', error);
    return {
      isValid: false,
      data: null,
      errors: [`Unexpected error during validation: ${error.message}`],
    };
  }
}

const submittedTestsSchema = z.object({
  user_email: z.string().email({ message: 'user_email must be a valid email id' }),
  test_ids: z.array(
    z.string().regex(/^[a-f\d]{24}$/i, {
      message: 'Each test_id must be a valid 24-character MongoDB ObjectId',
    })
  ).min(1, { message: 'test_ids array must contain at least one test ID' }),
});

export function validateSubmittedTestsRequest(requestData) {
  try {
    const result = submittedTestsSchema.safeParse(requestData);

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
    console.error('Submitted tests request validation error:', error);
    return {
      isValid: false,
      data: null,
      errors: [`Unexpected error during validation: ${error.message}`],
    };
  }
}
