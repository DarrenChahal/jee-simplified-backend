// Firestore configuration
export const firestoreConfig = {
    projectId: process.env.GCLOUD_PROJECT_ID,
    questionsCollection: 'questions',
    answersCollection: 'answers'
};

// Question validation constants
export const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];
export const CLASS_LEVELS = ['11', '12', 'dropper'];
export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
export const ORIGIN_TYPES = ['platform', 'mock_test', 'prev_year'];
export const ANSWER_TYPES = ['input', 'single-select', 'multi-select'];

// Answer validation constants
export const ANSWER_STATUS = ['skip', 'review', 'marked for review', 'accepted'];
export const VERDICT_TYPES = ['correct', 'incorrect'];
export const TEST_TYPES = ['mock', 'prev_year'];
