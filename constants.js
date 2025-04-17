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
export const ORIGIN_TYPES = ['platform', 'mock', 'prev_year'];
export const ANSWER_TYPES = ['input', 'single_choice', 'multi_choice'];


// Answer validation constants
export const ANSWER_STATUS = ['skip', 'review', 'marked for review', 'accepted'];
export const VERDICT_TYPES = ['correct', 'incorrect'];
export const TEST_TYPES = ['mock', 'prev_year'];
export const INSTITUTES = ['jee-simplified'];
export const TEST_STATUS = ['draft', 'scheduled', 'live', 'complete'];
export const TEST_PATTERN = ['jee-mains', 'jee-advance', 'none']
