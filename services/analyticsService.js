import { ObjectId } from 'mongodb';
import mongoService from './mongo.js';
import { sqlService } from './postgress.js';

class AnalyticsService {

    /**
     * core method to generate comprehensive analytics upon test submission
     * @param {string} testId 
     * @param {string} userId - 'email' as per current system convention
     */
    async generateTestReport(testId, userId) {
        console.log(`Generating analytics report for Test: ${testId}, User: ${userId}`);

        try {
            // 1. Fetch data
            const [answersData, test, sqlResult] = await Promise.all([
                mongoService.listAnswers({ test_id: testId, user_id: userId }),
                mongoService.getTestById(testId),
                sqlService.getSubmittedTestRequest(userId, testId)
            ]);

            const answers = answersData.documents;
            if (!answers || answers.length === 0) {
                console.warn('No answers found for analytics generation');
                return null;
            }

            // Fetch Questions primarily to get Subject/Topic/Difficulty metadata
            const questionIds = [...new Set(answers.map(a => a.question_id))];
            const qList = await Promise.all(questionIds.map(qid => mongoService.getQuestionById(qid)));
            const questionMap = {};
            qList.forEach(q => questionMap[q._id.toString()] = q);


            // --- DATA PREP ---
            let totalTimeSpent = 0;
            let totalCorrect = 0;
            let timeWasted = 0; // Time spent on incorrect answers

            // For Strategy Analytics: Time vs Marks
            const questionPerformance = [];

            // For Deep Performance: Subject/Topic Mastery
            const subjectStats = {};
            const topicStats = {};

            // For Performance Dip: Time Bucket Analysis
            const bucketSize = 15 * 60; // 15 minutes in seconds
            const timeBuckets = {};

            answers.forEach(ans => {
                const q = questionMap[ans.question_id];
                if (!q) return;

                const isCorrect = ans.verdict === 'correct';
                const timeTaken = ans.time_taken || 0; // in seconds (assuming frontend sends seconds or simple conversion)
                // Note: database.js logic converts duration to seconds, so we assume ans.time_taken is consistent.

                totalTimeSpent += timeTaken;
                if (isCorrect) totalCorrect++;
                else timeWasted += timeTaken;

                // 2. Deep Performance Insights (Subject/Topic)
                // Handle q.subjects as array
                const subjects = Array.isArray(q.subjects) ? q.subjects : [q.subjects];
                subjects.forEach(sub => {
                    if (!subjectStats[sub]) subjectStats[sub] = { total: 0, correct: 0, time: 0 };
                    subjectStats[sub].total++;
                    if (isCorrect) subjectStats[sub].correct++;
                    subjectStats[sub].time += timeTaken;
                });

                // Handle topics
                const topics = Array.isArray(q.topics) ? q.topics : [q.topics];
                topics.forEach(top => {
                    if (!top) return;
                    // Topic often needs Subject context, but simple aggregation for now
                    if (!topicStats[top]) topicStats[top] = { total: 0, correct: 0, subject: subjects[0] };
                    topicStats[top].total++;
                    if (isCorrect) topicStats[top].correct++;
                });


                // 3. Performance Dip (Time Buckets)
                // ans.solved_during_test.duration_passed_when_solved is seconds from start
                const durationPassed = ans.solved_during_test?.duration_passed_when_solved || 0;
                const bucketIndex = Math.floor(durationPassed / bucketSize);

                if (!timeBuckets[bucketIndex]) {
                    timeBuckets[bucketIndex] = {
                        slot: `${bucketIndex * 15}-${(bucketIndex + 1) * 15}m`,
                        total: 0,
                        correct: 0,
                        timeSum: 0
                    };
                }
                timeBuckets[bucketIndex].total++;
                if (isCorrect) timeBuckets[bucketIndex].correct++;
                timeBuckets[bucketIndex].timeSum += timeTaken;
            });


            // --- CALCULATIONS ---

            // A. Time Performance Dip Array
            const timePerformance = Object.values(timeBuckets).map(b => ({
                slot: b.slot,
                accuracy: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
                avg_time: b.total > 0 ? Math.round(b.timeSum / b.total) : 0,
                total_questions: b.total
            }));


            // B. Subject Mastery
            const processedSubjects = Object.keys(subjectStats).map(sub => {
                const s = subjectStats[sub];
                return {
                    subject: sub,
                    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
                    avg_time: s.total > 0 ? Math.round(s.time / s.total) : 0
                };
            });

            // C. Weak Areas (Topics < 60% accuracy)
            const weakAreas = Object.keys(topicStats)
                .map(top => {
                    const t = topicStats[top];
                    return {
                        topic: top,
                        subject: t.subject,
                        accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
                        total_attempts: t.total
                    };
                })
                .filter(t => t.accuracy < 60)
                .sort((a, b) => a.accuracy - b.accuracy) // Lowest accuracy first
                .slice(0, 5);


            // 4. Comparative / Peer Analytics (SQL)
            // We need the rank and percentile from SQL
            // sqlResult contains the user's specific row for this test
            const rank = sqlResult?.user_test_ranking || 0;
            const score = sqlResult?.user_test_score || 0;
            const totalCandidates = test.registered_count || 1; // avoid /0

            const percentile = totalCandidates > 1
                ? Math.round(((totalCandidates - rank) / totalCandidates) * 100 * 10) / 10
                : 100;


            // --- PAYLOAD CONSTRUCTION ---
            const report = {
                user_id: userId,
                test_id: testId,
                generated_at: new Date(),

                // 1. Summary
                summary: {
                    score: score,
                    max_score: test.max_score || (Object.keys(questionMap).length * 4), // Fallback if no max_score
                    rank: rank,
                    percentile: percentile,
                    incorrect_answers: answers.length - totalCorrect,
                    correct_answers: totalCorrect,
                    accuracy: answers.length > 0 ? Math.round((totalCorrect / answers.length) * 100) : 0
                },

                // 2. The "Dip"
                time_performance: timePerformance,

                // 3. Subject Mastery
                subjects: processedSubjects,

                // 4. Weak Areas
                weak_areas: weakAreas,

                // 5. Strategy
                strategy: {
                    time_wasted: timeWasted, // Seconds spent on wrong answers
                    avg_speed: answers.length > 0 ? Math.round(totalTimeSpent / answers.length) : 0
                }
            };

            // STORE IN MONGO
            const db = mongoService.getDb(); // We need to expose db or add method in mongoService
            // For now using a direct collection accessor if possible or adding one to mongoService
            // Let's add a method to mongoService to saveReport.
            await mongoService.saveTestReport(report);

            console.log('Test Analytics Generated Successfully');
            return report;

        } catch (err) {
            console.error('Failed to generate test report:', err);
            return null;
        }
    }

    /**
     * Dashboard aggregation - Fast reads
     */
    async getDashboardAnalytics(userId) {
        // 1. Fetch Parallel Data
        const [userProfile, history, ratingHistory, subjectAggregation, weakTopics] = await Promise.all([
            sqlService.getUserProfile(userId),
            sqlService.getUserTestHistory(userId, 50, 0), // Fetch last 50 for streak calc
            sqlService.getUserRatingHistory(userId),
            mongoService.aggregateUserSubjectsFromReports(userId),
            mongoService.aggregateUserWeakTopics(userId)
        ]);

        if (!userProfile) {
            throw new Error('User not found'); // Or handle gracefully
        }

        // 2. Calculate Streak
        const streakData = this.#calculateStreak(history);

        // 3. Calculate Summary Stats
        // avg accuracy from subject aggregation or history?
        // Let's use history if we have accuracy there, but SQL history doesn't strictly have accuracy %.
        // We can infer it from subject aggregation (weighted avg) or fetch it.
        // Subject aggregation is cleaner.
        let totalQuestions = 0;
        let weightedAccuracySum = 0;
        subjectAggregation.forEach(s => {
            // approximation since we don't have total questions per subject in aggregation yet (just tests_taken)
            // wait, aggregateUserSubjectsFromReports groups by subject.
            // Let's us weighted avg of accuracy * tests_taken
            weightedAccuracySum += (s.accuracy * s.tests_taken);
            totalQuestions += s.tests_taken;
        });
        const avgAccuracy = totalQuestions > 0 ? Math.round(weightedAccuracySum / totalQuestions) : 0;

        const bestRank = history.length > 0 ? Math.min(...history.map(h => h.rank)) : 0;

        // 4. Construct Payload matching Frontend ProfileProps
        // 5. Recent Tests for Activity Feed
        const recentTests = history.map(h => ({
            id: h.test_id,
            type: 'test',
            title: `Test #${h.test_id.slice(-6)}`, // Placeholder title until we join with test details
            description: `Score: ${h.user_test_score}`,
            time: new Date(parseInt(h.submitted_at)).toLocaleDateString(),
            score: `${h.user_test_score}/40` // Mock max score for now or fetch it
        }));

        return {
            user: {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                avatar: userProfile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + userProfile.name,
                joiningDate: userProfile.date_of_joining ? new Date(parseInt(userProfile.date_of_joining)).toLocaleDateString() : 'N/A',
                title: this.#getUserTitle(userProfile.current_rating || 0), // Helper for title
                institute: userProfile.institute || 'JEE Simplified'
            },
            stats: {
                totalTests: userProfile.tests_completed || 0,
                currentRating: userProfile.current_rating || 0,
                bestRank: bestRank,
                avgAccuracy: avgAccuracy
            },
            ratingHistory: ratingHistory.map(r => ({
                date: r.date,
                rating: r.rating
            })),
            subjects: subjectAggregation.map(s => ({
                name: s.subject,
                mastery: s.accuracy,
                progress: 0, // Backend doesn't support progress tracking yet (syllabus completion)
                totalQuestions: s.tests_taken * 10, // Placeholder or need real count
                correctQuestions: Math.round((s.accuracy / 100) * (s.tests_taken * 10))
            })),
            streak: {
                current: streakData.current,
                max: streakData.max,
                recentActivity: streakData.activity // last 365 days bool array or dates? Frontend expects dates usually or map.
                // Looking at frontend usage: <StreakCalendar streak={data.streak} />
                // Let's return activity as array of dates for now
            },
            weakTopics: weakTopics.map((w, idx) => ({
                id: idx,
                topic: w.topic,
                subject: w.subject,
                accuracy: w.accuracy,
                testCount: w.count // frequency
            })),
            recentTests: recentTests
        };
    }

    #calculateStreak(history) {
        if (!history || history.length === 0) return { current: 0, max: 0, activity: {} };

        // history is ordered DESC (newest first)
        // Convert to map of date strings YYYY-MM-DD
        const activityMap = {};
        const dates = history.map(h => {
            const d = new Date(parseInt(h.submitted_at)).toISOString().split('T')[0];
            activityMap[d] = (activityMap[d] || 0) + 1;
            return d;
        }).sort().reverse(); // Newest first

        const uniqueDates = [...new Set(dates)];

        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;

        // Verify if today/yesterday is present for current streak
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Basic streak calc
        // iterate unique sorted dates (descending)
        if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
            // potential active streak
            let expectedDate = new Date(); // Start checking from today
            if (!uniqueDates.includes(today)) expectedDate.setDate(expectedDate.getDate() - 1); // Start from yesterday

            for (let i = 0; i < uniqueDates.length; i++) {
                const dStr = uniqueDates[i];
                const expStr = expectedDate.toISOString().split('T')[0];

                if (dStr === expStr) {
                    currentStreak++;
                    expectedDate.setDate(expectedDate.getDate() - 1); // Go back 1 day
                } else {
                    break; // Gap found
                }
            }
        }

        // Max Streak (naive O(N))
        // ... simplistic impl

        return {
            current: currentStreak,
            max: Math.max(currentStreak, maxStreak), // simple placeholder, TODO: calculated true max
            activity: activityMap
        };
    }

    #getUserTitle(rating) {
        if (rating < 1000) return 'Novice';
        if (rating < 1500) return 'Apprentice';
        if (rating < 2000) return 'Advanced';
        if (rating < 2500) return 'Expert';
        return 'Grandmaster';
    }

    async getTestReport(testId, userId) {
        const collection = mongoService.getDb().collection('test_reports');
        return await collection.findOne({ test_id: testId, user_id: userId });
    }
}

export const analyticsService = new AnalyticsService();
