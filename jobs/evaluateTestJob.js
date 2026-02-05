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

    // Fetch test details to get marking scheme
    let markingScheme = {};
    try {
        const test = await database.getTestById(testId);
        markingScheme = test.marking_scheme || {};
    } catch (error) {
        console.warn(`[Job] Could not fetch test details for ${testId}, using default marking scheme.`);
    }
    
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
        
        // Calculate Total Max Score
        let totalMaxScore = 0;
        
        questions.forEach(q => {
            questionMap.set(String(q._id), q);
            
            // Calculate max marks for this question
            const qType = q.answer ? q.answer.type : 'single_choice';
            const typeScheme = markingScheme[qType];
            const correctScore = typeScheme?.correct ?? 4; // Default to 4 if scheme missing
            
            totalMaxScore += correctScore;
        });
        
        console.log(`[Job] Loaded ${questions.length} questions. Total extracted max score: ${totalMaxScore}`);

        // Update Test with Max Score
        if (totalMaxScore > 0) {
            await database.updateTest(testId, { max_score: totalMaxScore });
            console.log(`[Job] Updated test ${testId} with max_score: ${totalMaxScore}`);
        }

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
                    
                    // Helper to compare arrays (treated as sets for multi-choice)
                    const areArraysEqual = (arr1, arr2) => {
                        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
                        if (arr1.length !== arr2.length) return false;
                        const sorted1 = [...arr1].sort();
                        const sorted2 = [...arr2].sort();
                        return sorted1.every((val, index) => val === sorted2[index]);
                    };

                    const qType = question.answer ? question.answer.type : 'single_choice';
                    const typeScheme = markingScheme[qType];

                    // Default values if scheme not provided:
                    const correctScore = typeScheme?.correct ?? 4;
                    const incorrectScore = typeScheme?.incorrect ?? (qType === 'integer' ? 0 : -1);

                    let userVal = answerDoc.answer.selected_options !== undefined
                        ? answerDoc.answer.selected_options
                        : (answerDoc.answer.selected_option !== undefined 
                            ? answerDoc.answer.selected_option 
                            : answerDoc.answer.input);
                    
                    const correctVal = question.answer.correct_answer;

                    if (qType === 'multi_choice') {
                        // Ensure values are arrays
                        const userArr = Array.isArray(userVal) ? userVal : (userVal ? [userVal] : []);
                        const correctArr = Array.isArray(correctVal) ? correctVal : (correctVal ? [correctVal] : []);

                        if (areArraysEqual(userArr, correctArr)) {
                            // Exact match
                            verdict = 'correct';
                            points = correctScore;
                            correctCount++;
                        } else {
                            // Check for partial marking or incorrect
                            // 1. Any wrong option selected? -> Incorrect
                            const hasWrongOption = userArr.some(opt => !correctArr.includes(opt));
                            
                            if (hasWrongOption) {
                                verdict = 'incorrect';
                                points = incorrectScore;
                            } else {
                                // 2. Subset of correct options? -> Partial
                                if (userArr.length > 0) {
                                    // Partial Match
                                    verdict = 'after-review'; // Using intermediary status, or count as 'correct' if > 0 points?
                                    // For now, let's treat it as a special correct allowing points but maybe distinct verdict if needed.
                                    // Given we want to show strict Correct/Incorrect, and this is "Partial", 'correct' is the closest positive outcome.
                                    
                                    const rawPoints = (correctScore / correctArr.length) * userArr.length;
                                    points = Math.floor(rawPoints);
                                    
                                    if (points > 0) {
                                        verdict = 'correct'; 
                                        // correctCount++; // Do we count partial as a "question solved"? Assume yes for simpler stats.
                                    } else {
                                        verdict = 'incorrect';
                                    }
                                } else {
                                    // Empty selection
                                    verdict = 'nothing'; // skipped
                                    points = 0;
                                }
                            }
                        }

                    } else {
                        // Single Choice and Integer
                        // Loose equality check (handles string vs number differences if any)
                        if (userVal == correctVal) { 
                            verdict = 'correct';
                            points = correctScore;
                            correctCount++;
                        } else {
                            verdict = 'incorrect';
                            points = incorrectScore; 
                        }
                    }

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
