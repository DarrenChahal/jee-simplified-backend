
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});


class SQLService {
  async registerForTest(data) {
    const {
      user_email,
      test_id,
      questions_solved = 0,
      user_rating_post_test = 0,
      user_rating_change = 0,
      user_test_ranking = 0,
      user_test_duration = 0
    } = data;

    const created_at = Date.now();
    const updated_at = created_at;

    const query = `
      INSERT INTO registration_tracking (
        user_email,
        test_id,
        questions_solved,
        user_rating_post_test,
        user_rating_change,
        user_test_ranking,
        user_test_duration,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      user_email,
      test_id,
      questions_solved,
      user_rating_post_test,
      user_rating_change,
      user_test_ranking,
      user_test_duration,
      created_at,
      updated_at,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error('Error in registerUser:', err);
      throw err;
    }
  }

  async unregisterForTest(data) {
    const { user_email, test_id } = data;

    const query = `
      DELETE FROM registration_tracking
      WHERE user_email = $1 AND test_id = $2
      RETURNING *;
    `;

    const values = [user_email, test_id];

    try {
      const result = await pool.query(query, values);

      // If no row was deleted, user wasn't registered
      if (result.rows.length === 0) {
        throw new Error("User is not registered for this test.");
      }

      return result.rows[0]; // Return deleted registration row
    } catch (err) {
      console.error("Error in unregisterForTest:", err);
      throw err;
    }
  }


  async createUserFromClerk(userData) {
    const { clerk_user_id, user_email, user_name } = userData;

    const query = `
      INSERT INTO app_users (clerk_user_id, user_email, user_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (clerk_user_id) DO NOTHING
      RETURNING *;
    `;

    const values = [clerk_user_id, user_email, user_name];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user from Clerk:', err);
      throw err;
    }
  }

  async getRegisteredTests(email) {
    const query = `
      SELECT test_id FROM registration_tracking
      WHERE user_email = $1;
    `;
    const values = [email];

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (err) {
      console.error('Error in getRegisteredTests:', err);
      throw err;
    }
  }

  async submitTest(data) {
    const { user_email, test_id } = data;
    const submitted_at = Date.now();
    const updated_at = submitted_at;

    const query = `
      UPDATE registration_tracking
      SET submission_status = 'SUBMITTED',
          submitted_at = $3,
          updated_at = $4
      WHERE user_email = $1 AND test_id = $2
      RETURNING *;
    `;

    const values = [user_email, test_id, submitted_at, updated_at];

    try {
      const result = await pool.query(query, values);

      // If no row was updated, user is not registered for this test
      if (result.rows.length === 0) {
        throw new Error("User is not registered for this test.");
      }

      return result.rows[0];
    } catch (err) {
      console.error("Error in submitTest:", err);
      throw err;
    }
  }

  async getSubmittedTests(data) {
    const { user_email, test_ids } = data;

    // Create placeholders for the IN clause: $2, $3, $4, etc.
    const placeholders = test_ids.map((_, index) => `$${index + 2}`).join(', ');

    const query = `
      SELECT test_id FROM registration_tracking
      WHERE user_email = $1 
        AND test_id IN (${placeholders})
        AND submission_status = 'SUBMITTED';
    `;

    const values = [user_email, ...test_ids];

    try {
      const result = await pool.query(query, values);
      // Extract just the test_ids from the result rows
      return result.rows.map(row => row.test_id);
    } catch (err) {
      console.error("Error in getSubmittedTests:", err);
      throw err;
    }
  }
}

// Export both pool and service
export const sqlService = new SQLService();
export default pool;
