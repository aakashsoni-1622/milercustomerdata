import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

// GET /api/users/[id] - Get user by ID (SUPER_ADMIN, ADMIN only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const result = await query(
      `
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
      WHERE u.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user (SUPER_ADMIN, ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can update users
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
      password, // Optional - only update if provided
      firstName,
      lastName,
      role,
      phone,
      department,
      isActive,
    } = body;

    // Validation
    if (!username || !email || !firstName || !lastName || !role) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: username, email, firstName, lastName, role",
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

    const result = await withTransaction(async (client) => {
      // Get current user data
      const currentUserData = await client.query(
        "SELECT role FROM miler.users WHERE id = $1",
        [id]
      );

      if (currentUserData.rows.length === 0) {
        throw new Error("User not found");
      }

      const targetUserCurrentRole = currentUserData.rows[0].role;

      // Only SUPER_ADMIN can update SUPER_ADMIN users or assign SUPER_ADMIN role
      if (
        (targetUserCurrentRole === "SUPER_ADMIN" || role === "SUPER_ADMIN") &&
        currentUser.role !== "SUPER_ADMIN"
      ) {
        throw new Error("Only SUPER_ADMIN can modify SUPER_ADMIN users");
      }

      // Check if username or email already exists (excluding current user)
      const existingUser = await client.query(
        "SELECT id FROM miler.users WHERE (username = $1 OR email = $2) AND id != $3",
        [username, email, id]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("Username or email already exists");
      }

      // Prepare update query
      let updateQuery = `
        UPDATE miler.users 
        SET username = $1, email = $2, first_name = $3, last_name = $4, 
            role = $5, phone = $6, department = $7, is_active = $8, 
            updated_by = $9, updated_at = CURRENT_TIMESTAMP
      `;
      const queryParams = [
        username,
        email,
        firstName,
        lastName,
        role,
        phone,
        department,
        isActive,
        currentUser.id,
      ];

      // Add password update if provided
      if (password) {
        const passwordHash = await hashPassword(password);
        updateQuery += `, password_hash = $${queryParams.length + 1}`;
        queryParams.push(passwordHash);
      }

      updateQuery += ` WHERE id = $${
        queryParams.length + 1
      } RETURNING id, username, email, first_name, last_name, role, phone, department, is_active, updated_at`;
      queryParams.push(id);

      const userResult = await client.query(updateQuery, queryParams);

      // Log audit entry
      interface AuditDetails {
        updated_user: {
          id: string;
          username: string;
          email: string;
          role: string;
          firstName: string;
          lastName: string;
        };
        password_changed?: boolean;
      }

      const auditDetails: AuditDetails = {
        updated_user: {
          id,
          username,
          email,
          role,
          firstName,
          lastName,
        },
      };

      if (password) {
        auditDetails.password_changed = true;
      }

      await client.query(
        `
        INSERT INTO miler.user_audit_log (
          user_id, action, table_name, record_id, new_values, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          id,
          "USER_UPDATED",
          "users",
          id,
          JSON.stringify(auditDetails),
          request.headers.get("x-forwarded-for") || "unknown",
          request.headers.get("user-agent") || "unknown",
        ]
      );

      return userResult.rows[0];
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: result,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error) {
      if (error.message === "User not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "Username or email already exists") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message === "Only SUPER_ADMIN can modify SUPER_ADMIN users") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (SUPER_ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can delete users
    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only SUPER_ADMIN can delete users" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (currentUser.id.toString() === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (client) => {
      // Get user data for audit log
      const userData = await client.query(
        "SELECT username, email, role FROM miler.users WHERE id = $1",
        [id]
      );

      if (userData.rows.length === 0) {
        throw new Error("User not found");
      }

      const userToDelete = userData.rows[0];

      // Delete user sessions first
      await client.query("DELETE FROM miler.user_sessions WHERE user_id = $1", [
        id,
      ]);

      // Delete user
      await client.query("DELETE FROM miler.users WHERE id = $1", [id]);

      // Log audit entry
      await client.query(
        `
        INSERT INTO miler.user_audit_log (
          user_id, action, table_name, record_id, old_values, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          id,
          "USER_DELETED",
          "users",
          id,
          JSON.stringify({
            username: userToDelete.username,
            email: userToDelete.email,
            role: userToDelete.role,
          }),
          request.headers.get("x-forwarded-for") || "unknown",
          request.headers.get("user-agent") || "unknown",
        ]
      );

      return userToDelete;
    });

    return NextResponse.json({
      message: "User deleted successfully",
      deletedUser: result,
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
