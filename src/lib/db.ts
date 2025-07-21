import { Pool } from "pg";
console.log("DBurl", process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
