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
