// MongoDB-based implementation of FirestoreService
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { LRUCache } from 'lru-cache';

// Load environment variables
dotenv.config();

const dashboardCache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes
});

// MongoDB Initialization
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB_NAME);
console.log('MongoDB connection verified successfully');

console.log('MongoDB connection verified successfully');

class MongoService {
    getDb() {
        return db;
    }

    #questions() {
        return db.collection('questions');
    }

    #templates() {
        return db.collection('templates');
    }

    #tests() {
        return db.collection('tests');
    }

    #systemCounters() {
        return db.collection('system_counters');
    }

    #answers() {
        return db.collection('answers');
    }

    


    async #getNextQuestionNumber() {
        const result = await this.#systemCounters().findOneAndUpdate(
            { _id: 'lastQuestionNumber' },
            { $inc: { value: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        return result.value.value;
    }

    async createQuestion(questionData) {
        const questionNumber = await this.#getNextQuestionNumber();
        const documentData = {
            ...questionData,
            questionNumber,
            created_at: questionData.created_at || Date.now(),
            updated_at: questionData.updated_at || Date.now()
        };

        const result = await this.#questions().insertOne(documentData);
        documentData._id = result.insertedId;
        return documentData;
    }

    async getQuestionById(questionId) {
        const question = await this.#questions().findOne({ _id: new ObjectId(questionId) });
        if (!question) throw new Error('Question not found');
        return question;
    }

    async listAnswers(filters = {}) {
        const query = {};
        if (filters.question_id) query.question_id = filters.question_id;
        if (filters.user_id) query.user_id = filters.user_id;
        if (filters.test_id) query['solved_during_test.test_id'] = filters.test_id;
        if (filters.verdict) query.verdict = filters.verdict;
        
        // Special filter for missing verdict
        if (filters.verdict === null) {
            query.verdict = { $exists: false };
        }

        const documents = await this.#answers().find(query).toArray();
        return { documents };
    }

    async updateAnswer(answerId, answerData) {
        const updatedData = {
            ...answerData,
            updated_at: Date.now()
        };
        await this.#answers().updateOne({ _id: new ObjectId(answerId) }, { $set: updatedData });
        return this.#answers().findOne({ _id: new ObjectId(answerId) });
    }

    async getQuestionsByTestId(testId) {
        // Normalize to string to ensure consistency
        const testIdString = String(testId);
        console.log(`[MongoDB] Querying questions for test: ${testIdString}`);
        const questions = await this.#questions().find({ "origin.test_id": testIdString }).toArray();
        console.log(`[MongoDB] Found ${questions.length} questions for test ${testIdString}`);
        return questions;
    }

    async listQuestions(filters = {}) {
        const query = {};

        // normal field filters
        ['subject', 'for_class', 'topic', 'difficulty', 'origin'].forEach(key => {
            if (filters[key]) query[key] = filters[key];
        });

        // match inner field origin.test_id
        if (filters.test_id) {
            query["origin.test_id"] = filters.test_id;
        }

        const documents = await this.#questions().find(query).toArray();
        return { documents };
    }


    async updateQuestion(questionId, questionData) {
        const updatedData = {
            ...questionData,
            updated_at: Date.now()
        };
        await this.#questions().updateOne({ _id: new ObjectId(questionId) }, { $set: updatedData });
        return this.getQuestionById(questionId);
    }

    async deleteQuestion(questionId) {
        await this.#questions().deleteOne({ _id: new ObjectId(questionId) });
        return true;
    }

    async createTemplate(templateData) {
        const currentTime = Date.now();
        const documentData = {
            ...templateData,
            createdAt: currentTime,
            updatedAt: currentTime
        };

        const result = await this.#templates().insertOne(documentData);
        documentData._id = result.insertedId;
        return documentData;
    }

    async getTemplateById(templateId) {
        const template = await this.#templates().findOne({ _id: new ObjectId(templateId) });
        if (!template) throw new Error('Template not found');
        return template;
    }

    async listTemplates(filters = {}) {
        const query = {};
        if (filters.difficulty) query.difficulty = filters.difficulty;

        let documents = await this.#templates().find(query).toArray();

        if (filters.subject) {
            documents = documents.filter(doc =>
                doc.subject && doc.subject.includes(filters.subject)
            );
        }

        return { documents };
    }

    async updateTemplate(templateId, templateData) {
        const updatedData = {
            ...templateData,
            updatedAt: Date.now()
        };

        await this.#templates().updateOne({ _id: new ObjectId(templateId) }, { $set: updatedData });
        return this.getTemplateById(templateId);
    }

    async deleteTemplate(templateId) {
        await this.#templates().deleteOne({ _id: new ObjectId(templateId) });
        return true;
    }

    async createTest(testData) {
        const currentTime = Date.now();
        const institute = testData.institute || "jee-simplified";

        const documentData = {
            ...testData,
            created_at: currentTime,
            updated_at: currentTime,
            are_questions_public: testData.are_questions_public !== undefined ? testData.are_questions_public : false,
            registered_count: testData.registered_count || 0,
            test_pattern: testData.test_pattern || 'none',
            institute: institute
        };

        const result = await this.#tests().insertOne(documentData);
        const testId = result.insertedId;

        await this.#tests().updateOne(
            { _id: testId },
            {
                $set: {
                    bucket_path: `test_questions_attachments/${institute}/${testId}`,
                    questions_collection_name: `institutes/${institute}/test_questions/${testId}/questions`
                }
            }
        );
        return this.getTestById(testId);
    }

    async getTestById(testId) {
        const test = await this.#tests().findOne({ _id: new ObjectId(testId) });
        if (!test) throw new Error('Test not found');
        return test;
    }

    async listTests(filters = {}, options = {}) {
        const query = {};
        if (filters.subjects) query.subjects = { $in: [filters.subjects] };
        if (filters.difficulty) query.difficulty = filters.difficulty;
        if (filters.institute) query.institute = filters.institute;
        if (filters.status) query.status = filters.status;

        const total = await this.#tests().countDocuments(query);
        let cursor = this.#tests().find(query);

        // Sorting by created_at desc (latest first) makes sense for "past tests" and generally
        // But adhering strictly to "just add pagination" for now, unless implicit sort is desired.
        // Let's add latest-first sort as it's standard for lists like this.
        cursor = cursor.sort({ created_at: -1 });

        if (options.page && options.limit) {
            const skip = (options.page - 1) * options.limit;
            cursor = cursor.skip(skip).limit(options.limit);
        } else if (options.limit) {
            cursor = cursor.limit(options.limit);
        }

        const documents = await cursor.toArray();

        return {
            documents,
            pagination: {
                total,
                page: options.page || 1,
                limit: options.limit || total,
                totalPages: options.limit ? Math.ceil(total / options.limit) : 1
            }
        };
    }

    async updateTest(testId, testData) {
        const { _id, ...cleanData } = testData;

        const updatedData = {
            ...cleanData,
            updated_at: Date.now()
        };

        await this.#tests().updateOne(
            { _id: new ObjectId(testId) },
            { $set: updatedData }
        );

        return this.getTestById(testId);
    }


    async deleteTest(testId) {
        await this.#tests().deleteOne({ _id: new ObjectId(testId) });
        return true;
    }

    async addTestRegistration(testId) {
        await this.#tests().updateOne(
            { _id: new ObjectId(testId) },
            { $inc: { registered_count: 1 } }
        );
        return true;
    }

    async removeTestRegistration(testId) {
        await this.#tests().updateOne(
            { _id: new ObjectId(testId) },
            { $inc: { registered_count: -1 } }
        );
        return true;
    }

    async createOrUpdateAnswer(answerData) {
        const answers = this.#answers();
        const { _id, ...dataWithoutId } = answerData;

        // Determine the query filter
        let filter;
        if (_id) {
            filter = { _id: _id }; // Deterministic String ID
        } else {
            // Fallback to composite key if no _id provided
            const { user_id, question_id, solved_during_test } = answerData;
            const test_id = solved_during_test?.test_id || null;
            filter = {
                user_id,
                question_id,
                "solved_during_test.test_id": test_id
            };
        }

        // Handle specific fields (like preserving created_at on update)
        const updatePayload = {
            $set: {
                ...dataWithoutId,
                updatedAt: Date.now()
            },
            $setOnInsert: {
                createdAt: Date.now()
            }
        };

        // If _id is provided, ensure it's set on insert (though filter handles it usually)
        // If we rely on upsert with filter {_id: ...}, mongo sets it automatically.

        const result = await answers.findOneAndUpdate(
            filter,
            updatePayload,
            { upsert: true, returnDocument: 'after' }
        );

        return result.value || result; // .value for older drivers, result for newer
    }

    async updateAnswer(id, answerData) {
        // Delegate to createOrUpdateAnswer ensuring _id is included
        return this.createOrUpdateAnswer({ ...answerData, _id: id });
    }

    async getAnswerById(id) {
        const answer = await this.#answers().findOne({ _id: new ObjectId(id) });
        if (!answer) throw new Error('Answer not found');
        return answer;
    }

    async listAnswers(filters = {}) {
        const query = {};

        if (filters.user_id) query.user_id = filters.user_id;
        if (filters.question_id) query.question_id = filters.question_id;

        if (filters.test_id) {
            query["solved_during_test.test_id"] = filters.test_id;
        }

        const documents = await this.#answers().find(query).toArray();
        return { documents };
    }


    async deleteAnswer(id) {
        await this.#answers().deleteOne({ _id: new ObjectId(id) });
        return true;
    }

    async getEarliestTestAnswer(testId, userId) {
        const query = {
            "solved_during_test.test_id": testId,
            user_id: userId
        };

        const result = await this.#answers().find(query, {
            sort: { createdAt: 1 },
            limit: 1
        }).toArray();

        return result[0] || null;
    }

    // Dashboard Statistics Aggregations
    async getUserAnswerStats(userIds) {
        // userIds allows query by multiple IDs (e.g. email and clerk_id) if needed.
        // For now we expect a single userId commonly, or list.
        // We will cache by the first ID in the list as primary key or join them.
        const cacheKey = `stats:${userIds.join('|')}`;
        const cached = dashboardCache.get(cacheKey);
        if (cached) return cached;

        const matchStage = { $match: { user_id: { $in: userIds } } };

        // 1. Overall Stats
        const overallStatsPipeline = [
            matchStage,
            {
                $group: {
                    _id: null,
                    totalQuestions: { $sum: 1 },
                    correctAnswers: { $sum: { $cond: [{ $eq: ['$verdict', 'correct'] }, 1, 0] } },
                    incorrectAnswers: { $sum: { $cond: [{ $eq: ['$verdict', 'incorrect'] }, 1, 0] } },
                    timeSpent: { $sum: '$time_taken' } // ms
                }
            }
        ];

        // 2. Subject Stats
        // Note: questions.subject is an ARRAY, need to unwind
        // Also need to handle duplicate answers for same question (best verdict wins)

        // First, get total questions per subject
        const totalQuestionsPerSubject = await this.#questions().aggregate([
            { $unwind: '$subjects' },
            { $group: { _id: '$subjects', total: { $sum: 1 } } }
        ]).toArray();

        // Second, get user's performance per subject
        const userSubjectStatsPipeline = [
            matchStage,
            // Group by question_id to determine best verdict
            {
                $group: {
                    _id: '$question_id',
                    hasCorrect: { $max: { $cond: [{ $eq: ['$verdict', 'correct'] }, 1, 0] } },
                    hasIncorrect: { $max: { $cond: [{ $eq: ['$verdict', 'incorrect'] }, 1, 0] } }
                }
            },
            // Determine status: correct if any correct, else incorrect if any incorrect, else attempted
            {
                $addFields: {
                    status: {
                        $cond: [
                            { $eq: ['$hasCorrect', 1] }, 'correct',
                            {
                                $cond: [
                                    { $eq: ['$hasIncorrect', 1] }, 'incorrect',
                                    'attempted'
                                ]
                            }
                        ]
                    }
                }
            },
            // Lookup question to get subject
            {
                $lookup: {
                    from: 'questions',
                    let: { qId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$qId'] } } }
                    ],
                    as: 'question'
                }
            },
            { $unwind: { path: '$question', preserveNullAndEmptyArrays: false } },
            // Unwind subjects array (since subjects is an array in questions)
            { $unwind: { path: '$question.subjects', preserveNullAndEmptyArrays: false } },
            // Group by subject
            {
                $group: {
                    _id: '$question.subjects',
                    solved: { $sum: 1 },
                    correct: { $sum: { $cond: [{ $eq: ['$status', 'correct'] }, 1, 0] } },
                    incorrect: { $sum: { $cond: [{ $eq: ['$status', 'incorrect'] }, 1, 0] } }
                }
            }
        ];

        // 3. Weak Topics
        // Similar to subject stats but group by topic & subject
        const weakTopicsPipeline = [
            matchStage,
            // Group by question_id first
            {
                $group: {
                    _id: '$question_id',
                    hasCorrect: { $max: { $cond: [{ $eq: ['$verdict', 'correct'] }, 1, 0] } }
                }
            },
            // Lookup question
            {
                $lookup: {
                    from: 'questions',
                    let: { qId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$qId'] } } }
                    ],
                    as: 'question'
                }
            },
            { $unwind: { path: '$question', preserveNullAndEmptyArrays: false } },
            // Unwind subjects array
            { $unwind: { path: '$question.subjects', preserveNullAndEmptyArrays: false } },
            // Unwind topics array
            { $unwind: { path: '$question.topics', preserveNullAndEmptyArrays: false } },
            // Group by subject and topic
            {
                $group: {
                    _id: { subject: '$question.subjects', topic: '$question.topics' },
                    total: { $sum: 1 },
                    correct: { $sum: '$hasCorrect' }
                }
            },
            {
                $project: {
                    subject: '$_id.subject',
                    topic: '$_id.topic',
                    accuracy: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $multiply: [{ $divide: ['$correct', '$total'] }, 100] },
                            0
                        ]
                    },
                    total: 1
                }
            },
            { $sort: { accuracy: 1 } },
            { $limit: 5 }
        ];

        // 4. Activity Streak (Latest dates)
        const streakPipeline = [
            matchStage,
            {
                $project: {
                    date: {
                        $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } } // using createdAt or submittedAt
                    }
                }
            },
            { $group: { _id: "$date" } },
            { $sort: { _id: 1 } }
        ];


        const [overall, userSubjectStats, weakTopics, activity] = await Promise.all([
            this.#answers().aggregate(overallStatsPipeline).toArray(),
            this.#answers().aggregate(userSubjectStatsPipeline).toArray(),
            this.#answers().aggregate(weakTopicsPipeline).toArray(),
            this.#answers().aggregate(streakPipeline).toArray()
        ]);

        // Merge subject stats: combine total questions with user stats
        const subjects = totalQuestionsPerSubject.map(total => {
            const userStat = userSubjectStats.find(s => s._id === total._id) || {};
            return {
                _id: total._id,
                totalQuestions: total.total,
                solved: userStat.solved || 0,
                correct: userStat.correct || 0,
                incorrect: userStat.incorrect || 0
            };
        });

        const result = {
            overall: overall[0] || { totalQuestions: 0, correctAnswers: 0, incorrectAnswers: 0, timeSpent: 0 },
            subjects,
            weakTopics,
            activity: activity.map(a => a._id)
        };

        dashboardCache.set(cacheKey, result);
        return result;
    }
    async getTestResultsDetails(testIds, email) {
        if (!testIds.length) return {};

        // 1. Get Test Details
        const tests = await this.#tests().find({
            _id: { $in: testIds.map(id => new ObjectId(id)) }
        }).toArray();

        // 2. Get Total Questions for each test
        const questionsCounts = await this.#questions().aggregate([
            { $match: { "origin.test_id": { $in: testIds } } },
            { $group: { _id: "$origin.test_id", total: { $sum: 1 } } }
        ]).toArray();

        const countsMap = {};
        questionsCounts.forEach(c => {
            countsMap[c._id] = c.total;
        });

        const resultMap = {};
        tests.forEach(test => {
            const tId = test._id.toString();
            const totalQ = countsMap[tId] || 0;

            resultMap[tId] = {
                title: test.title,
                totalQuestions: totalQ,
                totalParticipants: test.registered_count || 0
            };
        });

        return resultMap;
    }


    async saveTestReport(report) {
        const collection = db.collection('test_reports');
        const filter = { user_id: report.user_id, test_id: report.test_id };
        await collection.deleteOne(filter); // Replace existing
        await collection.insertOne(report);
        return true;
    }

    async aggregateUserSubjectsFromReports(userId) {
        const collection = db.collection('test_reports');
        const pipeline = [
            { $match: { user_id: userId } },
            { $unwind: "$subjects" },
            {
                $group: {
                    _id: "$subjects.subject",
                    avg_accuracy: { $avg: "$subjects.accuracy" },
                    tests_taken: { $sum: 1 }
                }
            },
            {
                $project: {
                    subject: "$_id",
                    accuracy: { $round: ["$avg_accuracy", 1] },
                    tests_taken: 1
                }
            }
        ];
        return await collection.aggregate(pipeline).toArray();
    }

    async aggregateUserWeakTopics(userId) {
        const collection = db.collection('test_reports');
        const pipeline = [
            { $match: { user_id: userId } },
            { $unwind: "$weak_areas" },
            {
                $group: {
                    _id: "$weak_areas.topic",
                    count: { $sum: 1 },
                    avg_accuracy: { $avg: "$weak_areas.accuracy" },
                    subject: { $first: "$weak_areas.subject" }
                }
            },
            { $sort: { count: -1 } }, // Most frequent weak areas first
            { $limit: 10 },
            {
                $project: {
                    topic: "$_id",
                    count: 1,
                    accuracy: { $round: ["$avg_accuracy", 1] },
                    subject: 1
                }
            }
        ];
        return await collection.aggregate(pipeline).toArray();
    }
}
const mongoService = new MongoService();
export default mongoService;
