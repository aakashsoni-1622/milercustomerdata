import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  // TODO: Fetch customers from the database
  return NextResponse.json({ message: "Customers API" });
}

export async function POST(request: Request) {
  try {
    const { customer_name, contact_no, email } = await request.json();
    const result = await pool.query(
      "INSERT INTO customers (customer_name, contact_no, email) VALUES ($1, $2, $3) RETURNING *",
      [customer_name, contact_no, email]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting customer:", error);
    return NextResponse.json(
      { error: "Failed to insert customer" },
      { status: 500 }
    );
  }
}
