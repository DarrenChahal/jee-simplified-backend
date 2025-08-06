
import fs from 'fs';
import path from 'path';
import pool from '../services/postgress.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaDir = path.join(__dirname, 'schema');

const initSchema = async () => {
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
