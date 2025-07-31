import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const customerName = searchParams.get("customerName") || "";
    const orderDate = searchParams.get("orderDate") || "";
    const orderStatus = searchParams.get("orderStatus") || "";
    const orderTotal = searchParams.get("orderTotal") || "";
    const state = searchParams.get("state") || "";
    const paymentMode = searchParams.get("paymentMode") || "";

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(
        `(CAST(o.order_id AS TEXT) ILIKE $${paramIndex} OR o.item ILIKE $${paramIndex} OR c.customer_name ILIKE $${paramIndex} OR CAST(c.contact_no AS TEXT) ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (customerName) {
      whereConditions.push(`c.customer_name ILIKE $${paramIndex}`);
      queryParams.push(`%${customerName}%`);
      paramIndex++;
    }

    if (orderDate) {
      whereConditions.push(`DATE(o.date) = $${paramIndex}`);
      queryParams.push(orderDate);
      paramIndex++;
    }

    if (orderStatus) {
      whereConditions.push(`o.payment_mode ILIKE $${paramIndex}`);
      queryParams.push(`%${orderStatus}%`);
      paramIndex++;
    }

    if (orderTotal && !isNaN(parseFloat(orderTotal))) {
      whereConditions.push(`o.amount = $${paramIndex}`);
      queryParams.push(parseFloat(orderTotal));
      paramIndex++;
    }

    if (state) {
      whereConditions.push(`o.state ILIKE $${paramIndex}`);
      queryParams.push(`%${state}%`);
      paramIndex++;
    }

    if (paymentMode) {
      whereConditions.push(`o.payment_mode ILIKE $${paramIndex}`);
      queryParams.push(`%${paymentMode}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Build ORDER BY clause
    const orderByClause = `ORDER BY o.${sortBy} ${sortOrder.toUpperCase()}`;

    // Build LIMIT and OFFSET
    const offset = (page - 1) * limit;
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Main query to get orders with customer details
    const query = `
      SELECT 
        o.*,
        c.customer_name,
        c.contact_no,
        c.email,
        c.address,
        c.city,
        c.country
      FROM miler.orders_new o
      LEFT JOIN miler.customers c ON o.customer_id = c.id
      ${whereClause}
      ${orderByClause}
      ${limitClause}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM miler.orders o
      LEFT JOIN miler.customers c ON o.customer_id = c.id
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)), // Remove limit and offset for count
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      orders: result.rows,
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
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
