// MongoDB-based implementation of FirestoreService
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config();

// MongoDB Initialization
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB_NAME);
console.log('MongoDB connection verified successfully');

class MongoService {
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

    async listTests(filters = {}) {
        const query = {};
        if (filters.subjects) query.subjects = { $in: [filters.subjects] };
        if (filters.difficulty) query.difficulty = filters.difficulty;
        if (filters.institute) query.institute = filters.institute;
        if (filters.status) query.status = filters.status;

        const documents = await this.#tests().find(query).toArray();
        return { documents };
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

}

const mongoService = new MongoService();
export default mongoService;
