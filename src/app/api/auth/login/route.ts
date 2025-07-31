import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signJWT, UserRole } from "@/lib/auth";
import { createSession } from "@/lib/auth-server";
import { query, withTransaction } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const userQuery = `
      SELECT 
        id, username, email, password_hash, first_name, last_name, 
        role, is_active, phone, department, last_login
      FROM miler.users 
      WHERE (username = $1 OR email = $1) AND is_active = true
    `;

    const userResult = await query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Use transaction for session creation and login updates
    const result = await withTransaction(async (client) => {
      // Create session in database
      const sessionId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const sessionQuery = `
        INSERT INTO miler.user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `;

      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";

      await client.query(sessionQuery, [
        user.id,
        sessionId,
        expiresAt,
        clientIP,
        userAgent,
      ]);

      // Update last login
      const updateLoginQuery = `
        UPDATE miler.users 
        SET last_login = NOW() 
        WHERE id = $1
      `;
      await client.query(updateLoginQuery, [user.id]);

      // Log successful login
      const auditQuery = `
        INSERT INTO miler.user_audit_log (user_id, action, ip_address, user_agent)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(auditQuery, [
        user.id,
        "LOGIN_SUCCESS",
        clientIP,
        userAgent,
      ]);

      return { sessionId, clientIP, userAgent };
    });

    // Create JWT token
    const token = await signJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
      sessionId: result.sessionId,
    });

    // Set session cookie
    await createSession(token);

    // Return user data (without password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      department: user.department,
      lastLogin: user.last_login,
    };

    return NextResponse.json({
      success: true,
      user: userData,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
