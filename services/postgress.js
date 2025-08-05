// postgres.js

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
  async registerUser(data) {
    const {
      user_id,
      test_id,
      test_duration,
      test_date,
      status,
      total_questions,
      questions_solved,
    } = data;

    const created_at = Date.now();
    const updated_at = created_at;

    const query = `
      INSERT INTO registration_tracking (
        user_id,
        test_id,
        test_duration,
        test_date,
        status,
        total_questions,
        questions_solved,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      user_id,
      test_id,
      test_duration,
      test_date,
      status,
      total_questions,
      questions_solved,
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
}

// Export both pool and service
export const sqlService = new SQLService();
export default pool;
