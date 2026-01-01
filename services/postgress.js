
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
    const { user_email, test_id, user_test_duration } = data;
    const submitted_at = Date.now();
    const updated_at = submitted_at;

    const query = `
      UPDATE registration_tracking
      SET submission_status = 'SUBMITTED',
          submitted_at = $3,
          updated_at = $4,
          user_test_duration = $5
      WHERE user_email = $1 AND test_id = $2
      RETURNING *;
    `;

    const values = [user_email, test_id, submitted_at, updated_at, user_test_duration];

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

  async getUserProfile(email) {
    const query = `
      SELECT 
        u.id, 
        u.user_name as name, 
        u.user_email as email,
        u.date_of_joining,
        u.class,
        u.institute
      FROM app_users u
      WHERE u.user_email = $1;
    `;
    
    // Get latest rating stats
    const statsQuery = `
      SELECT 
        user_rating_post_test as current_rating,
        user_test_ranking as last_rank,
        user_rating_change as last_change,
        (SELECT COUNT(*) FROM registration_tracking WHERE user_email = $1 AND submission_status = 'SUBMITTED') as tests_completed
      FROM registration_tracking
      WHERE user_email = $1 AND submission_status = 'SUBMITTED'
      ORDER BY submitted_at DESC
      LIMIT 1;
    `;

    try {
      const [userRes, statsRes] = await Promise.all([
        pool.query(query, [email]),
        pool.query(statsQuery, [email])
      ]);

      if (userRes.rows.length === 0) return null;

      const user = userRes.rows[0];
      // If user has no submitted tests, statsRes.rows[0] will be undefined.
      // In that case, we need to manually query the count or just set it to 0.
      // However, the subquery for count is inside the main query which depends on WHERE matching a row.
      // If the user has NEVER submitted a test, the main query returns 0 rows, so we won't get the count (which is 0).
      // That is fine, stats will be empty object, we default tests_completed to 0.
      const stats = statsRes.rows[0] || { tests_completed: 0 };

      return { ...user, ...stats };
    } catch (err) {
      console.error('Error in getUserProfile:', err);
      throw err;
    }
  }

  async getUserRatingHistory(email) {
    const query = `
      SELECT 
        submitted_at as date,
        user_rating_post_test as rating
      FROM registration_tracking
      WHERE user_email = $1 AND submission_status = 'SUBMITTED'
      ORDER BY submitted_at ASC;
    `;
    try {
      const result = await pool.query(query, [email]);
      return result.rows.map(row => ({
        date: new Date(parseInt(row.date)).toLocaleString('default', { month: 'short' }),
        rating: row.rating
      }));
    } catch (err) {
      console.error('Error in getUserRatingHistory:', err);
      throw err;
    }
  }

  async checkAdminStatus(email) {
    const query = `
      SELECT role
      FROM app_users
      WHERE user_email = $1;
    `;
    
    try {
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null; // User not found
      }
      
      // Check if role is 'admin'
      return result.rows[0].role === 'admin';
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      throw err;
    }
  }

  async getUserTestHistoryCount(email) {
    const query = `
      SELECT COUNT(*)
      FROM registration_tracking
      WHERE user_email = $1 AND submission_status = 'SUBMITTED';
    `;
    try {
      const result = await pool.query(query, [email]);
      return parseInt(result.rows[0].count, 10);
    } catch (err) {
      console.error('Error in getUserTestHistoryCount:', err);
      throw err;
    }
  }

  async getUserTestHistory(email, limit, offset) {
    const query = `
      SELECT 
        test_id,
        questions_solved,
        submitted_at, 
        user_test_ranking as rank,
        user_test_duration,
        user_rating_post_test,
        user_rating_change
      FROM registration_tracking
      WHERE user_email = $1 AND submission_status = 'SUBMITTED'
      ORDER BY submitted_at DESC
      LIMIT $2 OFFSET $3;
    `;
    try {
      const result = await pool.query(query, [email, limit, offset]);
      return result.rows;
    } catch (err) {
      console.error('Error in getUserTestHistory:', err);
      throw err;
    }
  }
}

// Export both pool and service
export const sqlService = new SQLService();
export default pool;
