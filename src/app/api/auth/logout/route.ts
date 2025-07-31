import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clearSession } from "@/lib/auth-server";
import { withTransaction } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (user) {
      // Use transaction for logout operations
      await withTransaction(async (client) => {
        // Delete session from database
        const deleteSessionQuery = `
          DELETE FROM miler.user_sessions 
          WHERE user_id = $1
        `;
        await client.query(deleteSessionQuery, [user.id]);

        // Log logout
        const clientIP =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        const auditQuery = `
          INSERT INTO miler.user_audit_log (user_id, action, ip_address, user_agent)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(auditQuery, [
          user.id,
          "LOGOUT",
          clientIP,
          userAgent,
        ]);
      });
    }

    // Clear session cookie
    await clearSession();

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    // Clear session even if there's an error
    await clearSession();

    return NextResponse.json({
      success: true,
      message: "Logout completed",
    });
  }
}
