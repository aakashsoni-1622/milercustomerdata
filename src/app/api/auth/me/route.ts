import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { getSession } from "@/lib/auth-server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const token = await getSession();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get fresh user data from database
    const userQuery = `
      SELECT 
        id, username, email, first_name, last_name, 
        role, is_active, phone, department, last_login,
        created_at, updated_at
      FROM miler.users 
      WHERE id = $1 AND is_active = true
    `;

    const userResult = await query(userQuery, [payload.userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Check if session is still valid
    const sessionQuery = `
      SELECT expires_at 
      FROM miler.user_sessions 
      WHERE session_token = $1 AND user_id = $2
    `;

    const sessionResult = await query(sessionQuery, [
      payload.sessionId,
      user.id,
    ]);

    if (
      sessionResult.rows.length === 0 ||
      new Date(sessionResult.rows[0].expires_at) < new Date()
    ) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    // Return user data
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      phone: user.phone,
      department: user.department,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
