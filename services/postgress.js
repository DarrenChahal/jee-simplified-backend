
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
      test_duration,
      test_date,
      status,
      total_questions
    } = data;

    const created_at = Date.now();
    const updated_at = created_at;

    const query = `
      INSERT INTO registration_tracking (
        user_email,
        test_id,
        test_duration,
        test_date,
        status,
        total_questions,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      user_email,
      test_id,
      test_duration,
      test_date,
      status,
      total_questions,
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
}

// Export both pool and service
export const sqlService = new SQLService();
export default pool;
