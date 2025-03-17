// Test data for answer validation
// Run with: node test-answers.js

import { validateAnswer } from '../validators/answerValidator.js';
import { z } from 'zod';

// Simple test to check if Zod is working properly
const simpleSchema = z.object({
  name: z.string()
});

console.log("Testing basic Zod functionality:");
try {
  const result = simpleSchema.parse({ name: "test" });
  console.log("Basic Zod test passed!");
} catch (error) {
  console.error("Basic Zod test failed:", error);
}

console.log("\n");

// Current timestamp for all test cases
const currentTimestamp = new Date().toISOString();

// Reference to correct answers from questions (to ensure consistency)
const correctAnswers = {
  "question_001": { type: "input", value: "9.8 sin(30°) = 4.9 m/s²" },
  "question_002": { type: "single-select", value: 0 },
  "question_003": { type: "multi-select", value: [1, 2] },
  "question_004": { type: "input", value: "9 × 10^-4 N" },
  "question_005": { type: "input", value: "66" }
};

// Helper function to determine if an answer is correct
const isCorrectAnswer = (questionId, answer) => {
  const correctAnswer = correctAnswers[questionId];
  if (!correctAnswer) return false;
  
  if (correctAnswer.type === "input") {
    return answer.input === correctAnswer.value;
  } else if (correctAnswer.type === "single-select") {
    return answer.selected_option === correctAnswer.value;
  } else if (correctAnswer.type === "multi-select") {
    if (!answer.selected_options || !correctAnswer.value) return false;
    if (answer.selected_options.length !== correctAnswer.value.length) return false;
    return answer.selected_options.every(opt => correctAnswer.value.includes(opt)) &&
           correctAnswer.value.every(opt => answer.selected_options.includes(opt));
  }
  return false;
};

// Test cases for different answer types and scenarios
const testCases = [
  {
    name: "Valid input answer (practice mode)",
    data: {
      _id: "answer_001",
      question_id: "question_001",
      user_id: "user_123",
      question_type: "input", // Required field for answer validation
      solved_during_test: null, // Practice mode, not during a test
      time_taken: 120, // seconds
      answer: {
        input: "9.8 sin(30°) = 4.9 m/s²" // Matches correct answer
      },
      verdict: "correct", // Correct verdict
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Valid single-select answer (during test)",
    data: {
      _id: "answer_002",
      question_id: "question_002",
      user_id: "user_123",
      question_type: "single-select", // Required field for answer validation
      solved_during_test: {
        test_type: "mock",
        test_id: "mock_test_2025_03",
        duration_passed_when_solved: 1800, // 30 minutes in seconds
        marked_as: "accepted"
      },
      time_taken: 45, // seconds
      answer: {
        selected_option: 0 // Matches correct answer
      },
      verdict: "correct", // Correct verdict
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Valid multi-select answer with analysis sheet",
    data: {
      _id: "answer_003",
      question_id: "question_003",
      user_id: "user_456",
      question_type: "multi-select", // Required field for answer validation
      solved_during_test: {
        test_type: "prev_year",
        test_id: "jee_adv_2024",
        duration_passed_when_solved: 3600, // 1 hour in seconds
        marked_as: "review"
      },
      time_taken: 180, // seconds
      answer: {
        selected_options: [1, 2] // Matches correct answer
      },
      verdict: "correct", // Correct verdict
      analysis_sheet_id: "analysis_123",
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Valid incorrect answer (skipped during test)",
    data: {
      _id: "answer_004",
      question_id: "question_004",
      user_id: "user_789",
      question_type: "input", // Required field for answer validation
      solved_during_test: {
        test_type: "mock",
        test_id: "mock_test_2025_02",
        duration_passed_when_solved: 2400, // 40 minutes in seconds
        marked_as: "skip"
      },
      time_taken: 10, // seconds
      answer: {
        // For skipped questions, we need a valid format but can indicate it was skipped
        input: "SKIPPED"  // Doesn't match correct answer
      },
      verdict: "incorrect", // Correct verdict for wrong answer
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Valid incorrect answer (wrong selection)",
    data: {
      _id: "answer_005",
      question_id: "question_002", // Single-select question
      user_id: "user_123",
      question_type: "single-select", // Required field for answer validation
      solved_during_test: {
        test_type: "mock",
        test_id: "mock_test_2025_01",
        duration_passed_when_solved: 1200, // 20 minutes in seconds
        marked_as: "accepted"
      },
      time_taken: 90, // seconds
      answer: {
        selected_option: 1 // Doesn't match correct answer (0)
      },
      verdict: "incorrect", // Correct verdict for wrong answer
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Missing required field (question_id)",
    data: {
      _id: "answer_006",
      // question_id intentionally omitted
      user_id: "user_123",
      question_type: "input", // Required field for answer validation
      solved_during_test: null,
      time_taken: 60,
      answer: {
        input: "Some answer"
      },
      verdict: "incorrect",
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Incorrect answer format for question type",
    data: {
      _id: "answer_007",
      question_id: "question_002", // Single-select question
      user_id: "user_123",
      question_type: "single-select", // Required field for answer validation
      solved_during_test: null,
      time_taken: 45,
      answer: {
        input: "Wrong format" // Should be selected_option for single-select
      },
      verdict: "incorrect",
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Invalid test_type in solved_during_test",
    data: {
      _id: "answer_008",
      question_id: "question_003",
      user_id: "user_456",
      question_type: "multi-select", // Required field for answer validation
      solved_during_test: {
        test_type: "invalid_type", // Invalid test type
        test_id: "test_123",
        duration_passed_when_solved: 1500,
        marked_as: "accepted"
      },
      time_taken: 75,
      answer: {
        selected_options: [0, 2] // Doesn't match correct answer [1, 2]
      },
      verdict: "incorrect", // Correct verdict for wrong answer
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Negative time_taken",
    data: {
      _id: "answer_009",
      question_id: "question_001",
      user_id: "user_123",
      question_type: "input", // Required field for answer validation
      solved_during_test: null,
      time_taken: -30, // Negative time, should be invalid
      answer: {
        input: "Some answer" // Doesn't match correct answer
      },
      verdict: "incorrect", // Correct verdict for wrong answer
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Invalid verdict value",
    data: {
      _id: "answer_010",
      question_id: "question_005",
      user_id: "user_789",
      question_type: "input", // Required field for answer validation
      solved_during_test: null,
      time_taken: 120,
      answer: {
        input: "Some answer" // Doesn't match correct answer
      },
      verdict: "partially_correct", // Invalid verdict value
      submittedAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Inconsistent verdict (wrong answer marked as correct)",
    data: {
      _id: "answer_011",
      question_id: "question_001",
      user_id: "user_123",
      question_type: "input", // Required field for answer validation
      solved_during_test: null,
      time_taken: 120,
      answer: {
        input: "Wrong answer" // Doesn't match correct answer
      },
      verdict: "correct", // Inconsistent verdict
      submittedAt: currentTimestamp
    }
  }
];

// Add validation for verdict consistency
testCases.forEach(testCase => {
  // Skip test cases without question_id or with intentionally invalid verdicts
  if (!testCase.data.question_id || testCase.name.includes("Invalid: Invalid verdict value")) {
    return;
  }
  
  // Check if the verdict is consistent with the answer
  const isCorrect = isCorrectAnswer(testCase.data.question_id, testCase.data.answer);
  const hasCorrectVerdict = (isCorrect && testCase.data.verdict === "correct") || 
                           (!isCorrect && testCase.data.verdict === "incorrect");
  
  // Add a comment about verdict consistency
  if (!hasCorrectVerdict && !testCase.name.includes("Invalid: Inconsistent verdict")) {
    console.warn(`Warning: Test case "${testCase.name}" has inconsistent verdict. Answer is ${isCorrect ? 'correct' : 'incorrect'} but verdict is "${testCase.data.verdict}".`);
  }
});

// Test all cases and display results
console.log("Testing Answer Validation Schema\n");
console.log("=================================\n");

testCases.forEach(testCase => {
  console.log(`Test: ${testCase.name}`);
  try {
    const result = validateAnswer(testCase.data);
    
    if (result.isValid) {
      console.log("✅ VALID");
      
      // For valid test cases, check if verdict is consistent with answer
      if (result.isValid && testCase.data.question_id) {
        const isCorrect = isCorrectAnswer(testCase.data.question_id, testCase.data.answer);
        const hasCorrectVerdict = (isCorrect && testCase.data.verdict === "correct") || 
                                 (!isCorrect && testCase.data.verdict === "incorrect");
        
        if (!hasCorrectVerdict) {
          console.log(`⚠️ Warning: Answer is ${isCorrect ? 'correct' : 'incorrect'} but verdict is "${testCase.data.verdict}"`);
        }
      }
    } else {
      console.log("❌ INVALID");
      console.log("Errors:");
      result.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
  } catch (error) {
    console.log("❌ ERROR DURING VALIDATION");
    console.log("Error details:");
    console.log(error);
  }
  console.log("\n");
});
