import { NextResponse } from "next/server";
import { checkConnection, getPoolStats } from "@/lib/db";

export async function GET() {
  try {
    // Check database connectivity
    const isConnected = await checkConnection();

    // Get pool statistics
    const poolStats = getPoolStats();

    // Calculate pool health metrics
    const poolUtilization =
      poolStats.totalCount > 0
        ? (
            ((poolStats.totalCount - poolStats.idleCount) /
              poolStats.totalCount) *
            100
          ).toFixed(2)
        : "0.00";

    const healthStatus = {
      status: isConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || "5432",
        database: process.env.DB_NAME || "milercustomerdata",
      },
      connectionPool: {
        totalConnections: poolStats.totalCount,
        idleConnections: poolStats.idleCount,
        activeConnections: poolStats.totalCount - poolStats.idleCount,
        waitingRequests: poolStats.waitingCount,
        utilizationPercentage: `${poolUtilization}%`,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        serverTime: new Date().toISOString(),
      },
    };

    return NextResponse.json(healthStatus, {
      status: isConnected ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    const errorStatus = {
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      database: {
        connected: false,
      },
    };

    return NextResponse.json(errorStatus, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}
