import { Pool, PoolClient, PoolConfig } from "pg";

// Database connection configuration
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "milercustomerdata",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "root",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  min: 5, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times

  // Query timeout
  query_timeout: 60000, // 60 seconds
  statement_timeout: 60000, // 60 seconds

  // Connection retry (Note: acquireTimeoutMillis is not a standard pg option)
  // acquireTimeoutMillis: 60000, // This option doesn't exist in pg PoolConfig
};

console.log("=== DATABASE CONNECTION CHECK ===");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ Set" : "❌ Not set"
);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Pool Config:", {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  max: poolConfig.max,
  min: poolConfig.min,
});
console.log("===================================");

// Create the connection pool
const pool = new Pool(poolConfig);

// Pool event listeners for monitoring and debugging
pool.on("connect", () => {
  console.log("📊 New database client connected");
});

pool.on("acquire", () => {
  console.log("🔄 Client acquired from pool");
});

pool.on("remove", () => {
  console.log("🗑️ Client removed from pool");
});

pool.on("error", (err: Error) => {
  console.error("❌ Unexpected error on idle client:", err);
});

// Function to get pool stats
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};

// Function to execute queries with proper error handling
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("📊 Query executed:", {
      text: text.substring(0, 50) + "...",
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error("❌ Query error:", {
      text: text.substring(0, 50) + "...",
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
};

// Function to execute queries with a transaction
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Function to check database connectivity
export const checkConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    console.log("✅ Database connection test successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
};

// Graceful shutdown function
export const shutdown = async (): Promise<void> => {
  console.log("🛑 Shutting down database connection pool...");
  try {
    await pool.end();
    console.log("✅ Database pool closed successfully");
  } catch (error) {
    console.error("❌ Error closing database pool:", error);
  }
};

// Handle process termination gracefully
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("beforeExit", shutdown);

export default pool;
