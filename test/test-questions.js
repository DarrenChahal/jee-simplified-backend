// Test data for question validation
// Run with: node test-questions.js

import { validateQuestion } from '../validators/questionValidator.js';
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

// Test cases for different question types and scenarios
const testCases = [
  {
    name: "Valid input question (platform origin)",
    data: {
      _id: "question_001",
      subject: "Physics",
      for_class: "11",
      topic: "Mechanics",
      difficulty: "Medium",
      origin: "platform",
      test_info: null,
      question_text: "A block of mass 2kg slides down a frictionless incline of angle 30°. Calculate its acceleration in m/s².",
      question_attachments: ["https://example.com/incline_diagram.png"],
      answer_metadata: {
        answer_type: "input",
        correct_answer: "9.8 sin(30°) = 4.9 m/s²"
      },
      tags: ["Mechanics", "Inclined Plane", "Acceleration"],
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Valid single-select question",
    data: {
      _id: "question_002",
      subject: "Chemistry",
      for_class: "12",
      topic: "Organic Chemistry",
      difficulty: "Hard",
      origin: "platform",
      test_info: null,
      question_text: "Which of the following compounds exhibits optical isomerism?",
      answer_metadata: {
        answer_type: "single-select",
        options: [
          "2-butanol",
          "2,2-dimethylpropane",
          "1,2-dichloroethane",
          "Benzene"
        ],
        correct_option: 0
      },
      tags: ["Organic Chemistry", "Isomerism"],
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Valid multi-select question with attachments",
    data: {
      _id: "question_003",
      subject: "Mathematics",
      for_class: "dropper",
      topic: "Calculus",
      difficulty: "Hard",
      origin: "platform",
      test_info: null,
      question_text: "Which of the following functions are differentiable at x = 0?",
      question_attachments: [],
      answer_metadata: {
        answer_type: "multi-select",
        options: [
          "f(x) = |x|",
          "f(x) = x²",
          "f(x) = sin(x)/x if x ≠ 0, and 1 if x = 0",
          "f(x) = x·sin(1/x) if x ≠ 0, and 0 if x = 0"
        ],
        correct_options: [1, 2]
      },
      answer_attachments: {
        "option1_attachment": "https://example.com/graph1.png",
        "option2_attachment": "https://example.com/graph2.png"
      },
      tags: ["Calculus", "Differentiation", "Continuity"],
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Valid mock test question",
    data: {
      _id: "question_004",
      subject: "Physics",
      for_class: "12",
      topic: "Electrostatics",
      difficulty: "Medium",
      origin: "mock_test",
      test_info: [
        { test_type: "mock", test_id: "mock_test_2025_03" }
      ],
      question_text: "Two point charges, each of magnitude 1 μC, are placed 10 cm apart. Calculate the electric force between them.",
      answer_metadata: {
        answer_type: "input",
        correct_answer: "9 × 10^-4 N"
      },
      tags: ["Electrostatics", "Coulomb's Law"],
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Valid previous year question",
    data: {
      _id: "question_005",
      subject: "Mathematics",
      for_class: "dropper",
      topic: "Algebra",
      difficulty: "Hard",
      origin: "prev_year",
      test_info: [
        { test_type: "prev_year", test_id: "jee_adv_2024" }
      ],
      question_text: "If α, β, γ are the roots of the equation x³ - 6x² + 11x - 6 = 0, find the value of α²β + αβ² + β²γ + βγ² + γ²α + γα².",
      answer_metadata: {
        answer_type: "input",
        correct_answer: "66"
      },
      tags: ["Algebra", "Cubic Equations", "JEE Advanced 2024"],
      created_by: "admin@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Missing required field (subject)",
    data: {
      _id: "question_006",
      // subject intentionally omitted
      for_class: "11",
      topic: "Mechanics",
      difficulty: "Medium",
      origin: "platform",
      test_info: null,
      question_text: "A block slides down an incline. Determine its acceleration.",
      answer_metadata: {
        answer_type: "input",
        correct_answer: "g·sin(θ)"
      },
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Mock test without test_info",
    data: {
      _id: "question_007",
      subject: "Physics",
      for_class: "12",
      topic: "Optics",
      difficulty: "Easy",
      origin: "mock_test",
      test_info: null, // Should not be null for mock_test origin
      question_text: "What is the focal length of a convex lens?",
      answer_metadata: {
        answer_type: "input",
        correct_answer: "25 cm"
      },
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Single-select with insufficient options",
    data: {
      _id: "question_008",
      subject: "Chemistry",
      for_class: "11",
      topic: "Chemical Bonding",
      difficulty: "Medium",
      origin: "platform",
      test_info: null,
      question_text: "Which of the following has a covalent bond?",
      answer_metadata: {
        answer_type: "single-select",
        options: ["NaCl"], // Not enough options
        correct_option: 0
      },
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Invalid URL in attachments",
    data: {
      _id: "question_009",
      subject: "Physics",
      for_class: "12",
      topic: "Mechanics",
      difficulty: "Hard",
      origin: "platform",
      test_info: null,
      question_text: "A projectile is launched at an angle of 45°. Find its range.",
      question_attachments: ["invalid-url"], // Invalid URL format
      answer_metadata: {
        answer_type: "input",
        correct_answer: "v²/g"
      },
      created_by: "teacher@example.com",
      createdAt: currentTimestamp
    }
  },
  {
    name: "Invalid: Invalid email format",
    data: {
      _id: "question_010",
      subject: "Mathematics",
      for_class: "dropper",
      topic: "Calculus",
      difficulty: "Medium",
      origin: "platform",
      test_info: null,
      question_text: "Find the derivative of f(x) = x³ - 3x² + 2x - 1",
      answer_metadata: {
        answer_type: "input",
        correct_answer: "3x² - 6x + 2"
      },
      created_by: "invalid-email", // Invalid email format
      createdAt: currentTimestamp
    }
  }
];

// Test all cases and display results
console.log("Testing Question Validation Schema\n");
console.log("=================================\n");

// Legacy test cases - commented out
/*
testCases.forEach(testCase => {
  console.log(`Test: ${testCase.name}`);
  try {
    const result = validateQuestion(testCase.data);
    
    if (result.isValid) {
      console.log("✅ VALID");
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
*/

// New test cases using updated schema
const newTestCases = [
  {
    name: "Valid input question (prev_year origin)",
    data: {
      "_id": "q123",
      "subjects": ["Physics"],
      "for_class": ["11", "12", "dropper"],
      "topics": ["Mechanics"],
      "difficulty": "Medium",
      "origin": {
        "type": "prev_year",
        "exam": "JEE-Main",
        "year": 2023,
        "session": "May",
        "paper": "Paper 1",
        "test_id": "test456"
      },
      "question_text": "A block of mass m slides down a frictionless inclined plane with angle θ. What is the acceleration of the block?",
      "attachments": [
        "gs://bucket/diagram.png"
      ],
      "answer": {
        "type": "input",
        "options": [],
        "correct_answer": "g*sin(θ)",
        "solution": "The force acting along the inclined plane is mg*sin(θ), and using Newton's Second Law, we get a = g*sin(θ)"
      },
      "tags": ["JEE", "Mechanics", "Friction"],
      "created_by": "user_abc",
      "created_at": currentTimestamp,
      "updated_at": currentTimestamp
    }
  },
  {
    name: "Valid single choice question (mock origin)",
    data: {
      "_id": "q124",
      "subjects": ["Chemistry"],
      "for_class": ["12"],
      "topics": ["Electrochemistry"],
      "difficulty": "Hard",
      "origin": {
        "type": "mock",
        "exam": "JEE-Advanced",
        "test_id": "test789"
      },
      "question_text": "What is the standard reduction potential of the following half-cell reaction?\n2H+ + 2e- → H2",
      "attachments": [],
      "answer": {
        "type": "single_choice",
        "options": ["0.00 V", "0.76 V", "-0.76 V", "1.23 V"],
        "correct_answer": 0,
        "solution": "By definition, the standard hydrogen electrode has a standard reduction potential of 0.00 V."
      },
      "tags": ["JEE", "Electrochemistry", "Redox reactions"],
      "created_by": "user_def",
      "created_at": currentTimestamp,
      "updated_at": currentTimestamp
    }
  },
  {
    name: "Valid multi choice question (platform origin)",
    data: {
      "_id": "q125",
      "subjects": ["Mathematics"],
      "for_class": ["11", "12"],
      "topics": ["Functions"],
      "difficulty": "Medium",
      "origin": {
        "type": "platform",
        "exam": "JEE-Main"
      },
      "question_text": "Which of the following functions are continuous at x = 0? Select all that apply.",
      "attachments": [],
      "answer": {
        "type": "multi_choice",
        "options": [
          "f(x) = |x|",
          "f(x) = sin(x)/x, f(0) = 1",
          "f(x) = floor(x)",
          "f(x) = x^2 * sin(1/x), f(0) = 0"
        ],
        "correct_answer": [0, 1, 3],
        "solution": "Functions 1, 2, and 4 satisfy the continuity conditions at x = 0, while function 3 has a jump discontinuity at x = 0."
      },
      "tags": ["JEE", "Calculus", "Continuity"],
      "created_by": "user_ghi",
      "created_at": currentTimestamp,
      "updated_at": currentTimestamp
    }
  },
  {
    name: "Invalid: Missing required field (subjects)",
    data: {
      "_id": "invalid_q001",
      // subjects array intentionally omitted
      "for_class": ["11"],
      "topics": ["Mechanics"],
      "difficulty": "Medium",
      "origin": {
        "type": "platform",
        "exam": "JEE-Main"
      },
      "question_text": "A block slides down an incline. Determine its acceleration.",
      "answer": {
        "type": "input",
        "correct_answer": "g·sin(θ)"
      },
      "created_by": "user_xyz",
      "created_at": currentTimestamp
    }
  },
  {
    name: "Invalid: Mock origin without test_id",
    data: {
      "_id": "invalid_q002",
      "subjects": ["Physics"],
      "for_class": ["12"],
      "topics": ["Optics"],
      "difficulty": "Easy",
      "origin": {
        "type": "mock",
        "exam": "JEE-Main"
        // test_id is required for mock type but missing
      },
      "question_text": "What is the focal length of a convex lens?",
      "answer": {
        "type": "input",
        "correct_answer": "25 cm"
      },
      "created_by": "user_abc",
      "created_at": currentTimestamp
    }
  },
  {
    name: "Invalid: Single-choice with insufficient options",
    data: {
      "_id": "invalid_q003",
      "subjects": ["Chemistry"],
      "for_class": ["11"],
      "topics": ["Chemical Bonding"],
      "difficulty": "Medium",
      "origin": {
        "type": "platform",
        "exam": "JEE-Advanced"
      },
      "question_text": "Which of the following has a covalent bond?",
      "answer": {
        "type": "single_choice",
        "options": ["NaCl"], // Not enough options
        "correct_answer": 0
      },
      "created_by": "user_abc",
      "created_at": currentTimestamp
    }
  }
];

// Run tests with new schema
console.log("Testing with updated schema:");
newTestCases.forEach(testCase => {
  console.log(`Test: ${testCase.name}`);
  try {
    const result = validateQuestion(testCase.data);
    
    if (result.isValid) {
      console.log("✅ VALID");
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
