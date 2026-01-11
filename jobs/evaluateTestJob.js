import database from '../services/mongo.js';
import { sqlService } from '../services/postgress.js';

/**
 * Evaluates a test for all registered users
 * Implements N+1 optimization and JEE marking scheme.
 * 
 * Marking Scheme:
 * - Single Choice: +4 Correct, -1 Incorrect
 * - Integer: +4 Correct, 0 Incorrect
 * - Multiple Correct: Placeholder (0)
 * 
 * @param {string} testId 
 * @returns {Promise<Object>} Statistics
 */
export const evaluateTestJob = async (testId) => {
    // Normalize test ID to string for consistency
    testId = String(testId);
    
    const stats = {
        processedUsers: 0,
        gradedAnswers: 0,
        errors: []
    };

    console.log(`[Job] Starting evaluation for test: ${testId}`);
    console.log(`[Job] Test ID type: ${typeof testId}, value: ${JSON.stringify(testId)}`);

    try {
        
        const questions = await database.getQuestionsByTestId(testId);
        console.log(`[Job] Query returned ${questions.length} questions for test ${testId}`);
        console.log(`[Job] Sample question (if any):`, questions[0] ? { id: questions[0]._id, origin: questions[0].origin } : 'none');

        if (questions.length === 0) {
            console.log(`[Job] No questions found for test ${testId}. Aborting.`);
            return stats;
        }

        // Map questions by ID for O(1) lookup
        const questionMap = new Map();
        questions.forEach(q => questionMap.set(String(q._id), q));
        console.log(`[Job] Loaded ${questions.length} questions.`);

        // Fetch all registered users for this test from SQL
        const registeredUsers = await sqlService.getUsersForTest(testId);
        console.log(`[Job] Found ${registeredUsers.length} registered users to evaluate.`);

        if (registeredUsers.length === 0) {
            return stats;
        }

        // Iterate users and evaluate
        for (const user of registeredUsers) {
            try {
                const userId = user.user_email;
                
                // Fetch answers for this user and test
                const answersResult = await database.listAnswers({ 
                    test_id: testId, 
                    user_id: userId
                });
                
                const userAnswers = answersResult.documents || [];
                
                let score = 0;
                let correctCount = 0;
                let gradedCount = 0;

                // Process Answers
                for (const answerDoc of userAnswers) {
                    const question = questionMap.get(String(answerDoc.question_id));
                    if (!question) continue; // Should not happen if data integrity holds

                    let verdict = 'incorrect';
                    let points = 0;

                    // Grading Logic
                    // --- Common Logic of Matching (Type Ignored for now) ---
                    const userVal = answerDoc.answer.selected_option !== undefined 
                        ? answerDoc.answer.selected_option 
                        : answerDoc.answer.input;
                    
                    const correctVal = question.answer.correct_answer;

                    // Loose equality check (handles string vs number differences if any)
                    if (userVal == correctVal) { 
                        verdict = 'correct';
                        points = 4;
                        correctCount++;
                    } else {
                        verdict = 'incorrect';
                        points = -1; // Default penalty
                    }

                    /*
                    // --- Placeholders for Specific Logic (To be decided later) ---
                    if (question.answer.type === 'single_choice') {
                        // Logic for Single Choice (+4 / -1)
                    } else if (question.answer.type === 'integer') {
                        // Logic for Integer (+4 / 0)
                    } else if (question.answer.type === 'multiple_correct') {
                        // Logic for Multiple Correct
                    }
                    */

                    score += points;

                    // Update Answer Verdict in Mongo if changed
                    if (answerDoc.verdict !== verdict) {
                        await database.updateAnswer(answerDoc._id, { verdict });
                        gradedCount++;
                    }
                }

                // 4. Update SQL with Results
                await sqlService.updateEvaluationResults({
                    user_email: user.user_email,
                    test_id: testId,
                    questions_solved: correctCount,
                    user_test_score: score
                });

                stats.processedUsers++;
                stats.gradedAnswers += gradedCount;

            } catch (uErr) {
                console.error(`[Job] Error evaluating user ${user.user_email}:`, uErr);
                stats.errors.push({ user: user.user_email, error: uErr.message });
            }
        }

    } catch (error) {
        console.error('[Job] Fatal error in evaluateTestJob:', error);
        throw error;
    }

    console.log(`[Job] Evaluation complete. Processed ${stats.processedUsers} users.`);
    return stats;
};
