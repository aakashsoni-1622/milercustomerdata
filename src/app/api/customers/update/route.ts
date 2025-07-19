import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = Object.keys(updates)
      .map((key) => `${key} = $${Object.keys(updates).indexOf(key) + 2}`)
      .join(", ");

    if (!updateFields) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const values = [id, ...Object.values(updates)];
    const query = `
      UPDATE miler.customers 
      SET ${updateFields}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Customer updated successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
