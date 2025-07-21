import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "id";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const customerName = searchParams.get("customerName") || "";
    const city = searchParams.get("city") || "";
    const country = searchParams.get("country") || "";

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(
        `(customer_name ILIKE $${paramIndex} OR contact_no ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (customerName) {
      whereConditions.push(`customer_name ILIKE $${paramIndex}`);
      queryParams.push(`%${customerName}%`);
      paramIndex++;
    }

    if (city) {
      whereConditions.push(`city ILIKE $${paramIndex}`);
      queryParams.push(`%${city}%`);
      paramIndex++;
    }

    if (country) {
      whereConditions.push(`country ILIKE $${paramIndex}`);
      queryParams.push(`%${country}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Build ORDER BY clause
    const orderByClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Build LIMIT and OFFSET
    const offset = (page - 1) * limit;
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Main query to get customers with order count
    const query = `
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        SUM(o.amount) as total_amount
      FROM miler.customers c
      LEFT JOIN miler.orders o ON c.id = o.customer_id
      ${whereClause}
      GROUP BY c.id
      ${orderByClause}
      ${limitClause}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM miler.customers c
      LEFT JOIN miler.orders o ON c.id = o.customer_id
      ${whereClause}
    `;
    console.log("query", query);
    console.log("countQuery", countQuery);

    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)), // Remove limit and offset for count
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      customers: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.log("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
