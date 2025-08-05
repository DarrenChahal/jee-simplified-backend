
import fs from 'fs';
import path from 'path';
import pool from '../services/postgress';

const initSchema = async () => {
  const schemaDir = './schema';
  const files = fs.readdirSync(schemaDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // ensures correct order like 001_*, 002_*

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(schemaDir, file), 'utf-8');
      console.log(`⏳ Running schema: ${file}`);
      await pool.query(sql);
    }
    console.log('✅ All schema files executed.');
  } catch (err) {
    console.error('❌ Error running schema files:', err);
    process.exit(1);
  }
};

export default initSchema;
