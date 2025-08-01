import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

// GET /api/users - List all users (SUPER_ADMIN, ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can view users
    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.phone,
        u.department,
        u.last_login,
        u.created_at,
        u.updated_at,
        creator.username as created_by_username,
        updater.username as updated_by_username
      FROM miler.users u
      LEFT JOIN miler.users creator ON u.created_by = creator.id
      LEFT JOIN miler.users updater ON u.updated_by = updater.id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (SUPER_ADMIN, ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can create users
    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      department,
      isActive = true,
    } = body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: username, email, password, firstName, lastName, role",
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "OPERATIONS",
      "CUSTOMER_SUPPORT",
      "VIEWER",
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: " + validRoles.join(", ") },
        { status: 400 }
      );
    }

    // Only SUPER_ADMIN can create SUPER_ADMIN users
    if (role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only SUPER_ADMIN can create SUPER_ADMIN users" },
        { status: 403 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const result = await withTransaction(async (client) => {
      // Check if username or email already exists
      const existingUser = await client.query(
        "SELECT id FROM miler.users WHERE username = $1 OR email = $2",
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("Username or email already exists");
      }

      // Create user
      const userResult = await client.query(
        `
        INSERT INTO miler.users (
          username, email, password_hash, first_name, last_name, 
          role, phone, department, is_active, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, username, email, first_name, last_name, role, 
                  phone, department, is_active, created_at
      `,
        [
          username,
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          phone,
          department,
          isActive,
          currentUser.id,
          currentUser.id,
        ]
      );

      // Log audit entry
      await client.query(
        `
        INSERT INTO miler.user_audit_log (
          user_id, action, table_name, record_id, new_values, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          userResult.rows[0].id,
          "USER_CREATED",
          "users",
          userResult.rows[0].id,
          JSON.stringify({
            username,
            email,
            role,
            firstName,
            lastName,
            department,
            phone,
            isActive,
          }),
          request.headers.get("x-forwarded-for") || "unknown",
          request.headers.get("user-agent") || "unknown",
        ]
      );

      return userResult.rows[0];
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);

    if (
      error instanceof Error &&
      error.message === "Username or email already exists"
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
