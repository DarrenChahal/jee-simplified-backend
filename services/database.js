import mongoService from './mongo.js';
import {sqlService} from './postgress.js';
import adminCache from './adminCache.js';

class DatabaseService {
    /**
     * Creates a new question in the database
     * @param {Object} questionData - The question data to store
     * @returns {Promise<Object>} - The created question document
     */
    async createQuestion(questionData) {
        return mongoService.createQuestion(questionData);
    }
    
    /**
     * Gets a question by ID
     * @param {string} questionId - The ID of the question to retrieve
     * @returns {Promise<Object>} - The question document
     */
    async getQuestionById(questionId) {
        return mongoService.getQuestionById(questionId);
    }
    
    /**
     * Lists questions with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of question documents
     */
    async listQuestions(filters = {}) {
        return mongoService.listQuestions(filters);
    }
    
    /**
     * Updates a question by ID
     * @param {string} questionId - The ID of the question to update
     * @param {Object} questionData - The updated question data
     * @returns {Promise<Object>} - The updated question document
     */
    async updateQuestion(questionId, questionData) {
        return mongoService.updateQuestion(questionId, questionData);
    }
    
    /**
     * Deletes a question by ID
     * @param {string} questionId - The ID of the question to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteQuestion(questionId) {
        return mongoService.deleteQuestion(questionId);
    }

    async addTestRegistration(testId){
        return mongoService.addTestRegistration(testId);
    }

    async removeTestRegistration(testId){
        return mongoService.removeTestRegistration(testId);
    }
    
    // Answer-related methods
    async createAnswer(answerData) {
        return mongoService.createOrUpdateAnswer(answerData);
    }

    async getAnswerById(id) {
        return mongoService.getAnswerById(id);
    }

    async listAnswers(filters = {}) {
        return mongoService.listAnswers(filters);
    }

    async updateAnswer(id, answerData) {
        return mongoService.updateAnswer(id, answerData);
    }

    async deleteAnswer(id) {
        return mongoService.deleteAnswer(id);
    }
    
    // Template-related methods
    /**
     * Creates a new template in the database
     * @param {Object} templateData - The template data to store
     * @returns {Promise<Object>} - The created template document
     */
    async createTemplate(templateData) {
        return mongoService.createTemplate(templateData);
    }
    
    /**
     * Gets a template by ID
     * @param {string} templateId - The ID of the template to retrieve
     * @returns {Promise<Object>} - The template document
     */
    async getTemplateById(templateId) {
        return mongoService.getTemplateById(templateId);
    }
    
    /**
     * Lists templates with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of template documents
     */
    async listTemplates(filters = {}) {
        return mongoService.listTemplates(filters);
    }
    
    /**
     * Updates a template by ID
     * @param {string} templateId - The ID of the template to update
     * @param {Object} templateData - The updated template data
     * @returns {Promise<Object>} - The updated template document
     */
    async updateTemplate(templateId, templateData) {
        return mongoService.updateTemplate(templateId, templateData);
    }
    
    /**
     * Deletes a template by ID
     * @param {string} templateId - The ID of the template to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteTemplate(templateId) {
        return mongoService.deleteTemplate(templateId);
    }
    
    // Test-related methods
    /**
     * Creates a new test in the database
     * @param {Object} testData - The test data to store
     * @returns {Promise<Object>} - The created test document
     */
    async createTest(testData) {
        return mongoService.createTest(testData);
    }
    
    /**
     * Gets a test by ID
     * @param {string} testId - The ID of the test to retrieve
     * @returns {Promise<Object>} - The test document
     */
    async getTestById(testId) {
        return mongoService.getTestById(testId);
    }
    
    /**
     * Lists tests with optional filters
     * @param {Object} filters - Optional filters for the query
     * @returns {Promise<Object>} - The list of test documents
     */
    async listTests(filters = {}) {
        return mongoService.listTests(filters);
    }
    
    /**
     * Updates a test by ID
     * @param {string} testId - The ID of the test to update
     * @param {Object} testData - The updated test data
     * @returns {Promise<Object>} - The updated test document
     */
    async updateTest(testId, testData) {
        return mongoService.updateTest(testId, testData);
    }
    
    /**
     * Deletes a test by ID
     * @param {string} testId - The ID of the test to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteTest(testId) {
        return mongoService.deleteTest(testId);
    }

    async registerForTest(data) {
        return sqlService.registerForTest(data);
    }

    async unregisterForTest(data){
        return sqlService.unregisterForTest(data);
    }

    async createUserFromClerk(userData) {
        return sqlService.createUserFromClerk(userData);
    }

    async getRegisteredTests(email) {
        return sqlService.getRegisteredTests(email);
    }

    async submitTest(data) {
        const { user_email, test_id } = data;
        let user_test_duration = 0;

        try {
            // 1. Get Test Details for scheduled start time
            // We use mongoService directly as it's imported
            const test = await mongoService.getTestById(test_id);
            
            // Handle test_date format (detect if seconds or ms)
            let testStartTime = 0;
            if (test.test_date) {
                testStartTime = Number(test.test_date);
                // Heuristic: If timestamp is in seconds (e.g. 10 digits), convert to ms
                if (testStartTime < 10000000000) {
                    testStartTime *= 1000;
                }
            }

            // 2. Get Earliest Answer
            const earliestAnswer = await mongoService.getEarliestTestAnswer(test_id, user_email);

            if (earliestAnswer) {
                // Determine created_at field (handle potential naming variations)
                const answerCreatedAt = earliestAnswer.createdAt || earliestAnswer.created_at || Date.now();
                const timeTaken = earliestAnswer.time_taken || 0; // ms

                let calculatedStartTime = answerCreatedAt - timeTaken;

                // Safety check: ensure start time is not before test start time
                // Only if test has a scheduled start time
                if (testStartTime > 0 && calculatedStartTime < testStartTime) {
                    calculatedStartTime = testStartTime;
                }

                // Calculate duration: Now - Calculated Start
                user_test_duration = Date.now() - calculatedStartTime;

                // Ensure non-negative
                if (user_test_duration < 0) user_test_duration = 0;
            }
        } catch (err) {
            console.error("Error calculating user_test_duration:", err);
            // Proceed with submission even if calculation fails? 
            // We'll log it and let duration be 0 or keep partial calculation.
        }

        return sqlService.submitTest({ 
            ...data, 
            user_test_duration 
        });
    }

    async getSubmittedTests(data) {
        return sqlService.getSubmittedTests(data);
    }

    async getUserProfile(email) {
        return sqlService.getUserProfile(email);
    }

    async getUserRatingHistory(email) {
        return sqlService.getUserRatingHistory(email);
    }

    async getUserAnswerStats(userIds) {
        return mongoService.getUserAnswerStats(userIds);
    }

    async getUserDashboard(email) {
        // 1. Get User Profile from SQL (includes latest rating/rank)
        const profile = await this.getUserProfile(email);
        if (!profile) {
            throw new Error('User not found');
        }

        // 2. Prepare User IDs for Mongo Aggregation
        // We use both email and clerk_id (if available) to match answers
        // assuming answers could be tagged by either.
        // Based on answer schema, user_id is a string. It's likely the Clerk ID or Email.
        // We will pass both just in case, or just the email if that's the convention.
        // Checking schema: user_id is string.
        // Let's pass [email, profile.clerk_user_id] filtering out nulls.
        const userIds = [email];
        // Note: We don't have clerk_user_id in the profile returned by getUserProfile SQL query yet, 
        // need to make sure it's selected if we want to use it.
        // The getUserProfile SQL selected: id, user_name, user_email, date_of_joining, class, institute.
        // Let's assume for now answers are keyed by email or handled upstrem. 
        // If answers are keyed by Clerk ID, we should select it in getUserProfile.

        // 3. Parallel Fetch: Rating History & Answer Stats
        const [ratingHistory, answerStats] = await Promise.all([
            this.getUserRatingHistory(email),
            this.getUserAnswerStats(userIds) 
        ]);

        // 4. Calculate Derived Metrics (Streak)
        const activityDates = answerStats.activity; // ["2024-01-01", "2024-01-02"] sorted ASC
        
        let currentStreak = 0;
        let longestStreak = 0;
        
        if (activityDates.length > 0) {
            // --- Current Streak Calculation ---
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const lastActive = activityDates[activityDates.length - 1];
            
            if (lastActive === today || lastActive === yesterday) {
                currentStreak = 1;
                // Walk backwards for current streak
                for (let i = activityDates.length - 1; i > 0; i--) {
                    const curr = new Date(activityDates[i]);
                    const prev = new Date(activityDates[i - 1]);
                    const diffTime = Math.abs(curr - prev);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays === 1) {
                        currentStreak++;
                    } else if (diffDays === 0) {
                        continue; // Same day
                    } else {
                        break; // Gap found
                    }
                }
            }

            // --- Longest Streak Calculation ---
            let tempStreak = 1;
            longestStreak = 1; // At least 1 if there is activity
            
            for (let i = 1; i < activityDates.length; i++) {
                const curr = new Date(activityDates[i]);
                const prev = new Date(activityDates[i - 1]);
                const diffTime = Math.abs(curr - prev);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak++;
                } else if (diffDays > 1) {
                     // Gap found, reset
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
                // if diffDays === 0 (same day), do nothing, keep streak count
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }

        // Avatar Initials
        const getAvatarInitials = (name) => {
             if (!name) return "";
             return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
        };

        return {
            user: {
                id: profile.id,
                name: profile.name,
                username: profile.email.split('@')[0],
                avatarUrl: getAvatarInitials(profile.name),
                joinedDate: new Date(parseInt(profile.date_of_joining)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                badges: [],
                rank: profile.last_rank || 0,
                rating: profile.current_rating || 0,
                percentile: 0,
                dayStreak: currentStreak
            },
            stats: {
                totalQuestions: answerStats.overall.totalQuestions,
                correctAnswers: answerStats.overall.correctAnswers,
                accuracy: answerStats.overall.totalQuestions > 0 ? (answerStats.overall.correctAnswers / answerStats.overall.totalQuestions * 100) : 0,
                incorrectAnswers: answerStats.overall.incorrectAnswers,
                timeSpentMinutes: Math.round(answerStats.overall.timeSpent / 1000 / 60),
                // Provide avg time in Minutes to match expectation
                avgTimePerQuestion: answerStats.overall.totalQuestions > 0 ? (answerStats.overall.timeSpent / 1000 / 60 / answerStats.overall.totalQuestions) : 0,
                currentRating: profile.current_rating || 0,
                ratingChange: profile.last_change || 0,
                testsCompleted: profile.tests_completed ? parseInt(profile.tests_completed) : 0,
                fullMocks: 0,
                airPercentile: 0,
                percentileLabel: "Unranked",
                // Avg Speed: Questions per Minute
                avgSpeedPerQuestion: (answerStats.overall.timeSpent > 0 && answerStats.overall.totalQuestions > 0) 
                    ? parseFloat((answerStats.overall.totalQuestions / (answerStats.overall.timeSpent / 1000 / 60)).toFixed(1))
                    : 0
            },
            ratingHistory,
            subjects: answerStats.subjects.map(s => ({
                name: s._id,
                totalQuestions: s.totalQuestions,
                solved: s.solved,
                correct: s.correct,
                incorrect: s.incorrect,
                accuracy: s.solved > 0 ? parseFloat(((s.correct / s.solved) * 100).toFixed(1)) : 0
            })),
            streak: {
                current: currentStreak,
                longest: longestStreak,
                activity: activityDates.map(d => ({ day: new Date(d).toLocaleDateString('en-US', { weekday: 'short' }), active: true })).slice(-7)
            },
            weakTopics: answerStats.weakTopics.map(t => ({
                subject: t.subject,
                topic: t.topic,
                accuracy: t.accuracy,
                trend: 0
            })),
            achievements: []
        };
    }

    async getUserTestResults(email, page = 1, limit = 10) {
        // 1. Get total count
        const total = await sqlService.getUserTestHistoryCount(email);
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // 2. Get Paginated History from SQL
        const history = await sqlService.getUserTestHistory(email, limit, offset);
        
        if (history.length === 0) {
            return {
                total,
                page,
                limit,
                totalPages,
                results: []
            };
        }

        // 3. Get Details from Mongo
        const testIds = history.map(h => h.test_id);
        const detailsMap = await mongoService.getTestResultsDetails(testIds, email);

        // 4. Merge
        const results = history.map(h => {
             const details = detailsMap[h.test_id] || {};
             
             return {
                 testId: h.test_id,
                 title: details.title || "Unknown Test",
                 submittedAt: parseInt(h.submitted_at),
                 ratingAfterTest: h.user_rating_post_test || 0,
                 ratingChange: h.user_rating_change || 0,
                 timeTaken: h.user_test_duration || 0, 
                 questionsSolved: h.questions_solved || 0,
                 totalQuestions: details.totalQuestions || 0,
                 rank: h.rank || 0,
                 totalParticipants: details.totalParticipants || 0
             };
        });

        return {
            total,
            page,
            limit,
            totalPages,
            results
        };
    }

    async checkAdminStatus(email) {
        // Check cache first
        const cacheKey = `admin:${email}`;
        const cachedStatus = adminCache.get(cacheKey);
        
        if (cachedStatus !== undefined) {
            console.log(`Admin status cache hit for: ${email}`);
            return cachedStatus;
        }
        
        // Cache miss - query database
        console.log(`Admin status cache miss for: ${email}`);
        const isAdmin = await sqlService.checkAdminStatus(email);
        
        // Store in cache (even if null/false)
        if (isAdmin !== null) {
            adminCache.set(cacheKey, isAdmin);
        }
        
        return isAdmin;
    }
}

const database = new DatabaseService();
export default database;
