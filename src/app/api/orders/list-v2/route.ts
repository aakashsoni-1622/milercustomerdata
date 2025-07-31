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
    const state = searchParams.get("state") || "";
    const paymentMode = searchParams.get("paymentMode") || "";

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(
        `(CAST(o.order_id AS TEXT) ILIKE $${paramIndex} OR c.customer_name ILIKE $${paramIndex} OR CAST(c.contact_no AS TEXT) ILIKE $${paramIndex})`
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
      whereConditions.push(`DATE(o.order_date) = $${paramIndex}`);
      queryParams.push(orderDate);
      paramIndex++;
    }

    if (orderStatus) {
      whereConditions.push(`o.order_status ILIKE $${paramIndex}`);
      queryParams.push(`%${orderStatus}%`);
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

    // Validate sort column
    const validSortColumns = [
      "order_id",
      "order_date",
      "state",
      "total_amount",
      "payment_mode",
      "order_status",
      "created_at",
      "customer_name",
    ];
    const safeSortBy = validSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM miler.orders_new o
      JOIN miler.customers c ON o.customer_id = c.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get orders with aggregated order items
    const ordersQuery = `
      SELECT 
        o.id,
        o.order_id,
        o.order_date,
        o.state,
        o.total_amount,
        o.payment_mode,
        o.payment_received,
        o.order_confirmation,
        o.order_status,
        o.comments,
        o.process_order,
        o.order_packed,
        o.order_cancelled,
        o.delivered,
        o.is_rto,
        o.rto_reason,
        o.review_taken,
        o.customer_review,
        o.product_review,
        o.is_return,
        o.whatsapp_notification_failed_reason,
        o.created_at,
        o.updated_at,
        c.id as customer_id,
        c.customer_name,
        c.contact_no,
        c.email,
        c.address,
        c.city,
        c.country,
        -- Aggregate order items
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_code', p.product_code,
            'product_name', p.product_name,
            'category', p.category,
            'selected_colors', oi.selected_colors,
            'selected_sizes', oi.selected_sizes,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          ) ORDER BY oi.id
        ) as order_items
      FROM miler.orders_new o
      JOIN miler.customers c ON o.customer_id = c.id
      LEFT JOIN miler.order_items oi ON o.id = oi.order_id
      LEFT JOIN miler.products p ON oi.product_id = p.id
      ${whereClause}
      GROUP BY o.id, c.id, c.customer_name, c.contact_no, c.email, c.address, c.city, c.country
      ORDER BY ${
        safeSortBy === "customer_name" ? "c.customer_name" : "o." + safeSortBy
      } ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const ordersResult = await pool.query(ordersQuery, queryParams);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };

    return NextResponse.json({
      success: true,
      orders: ordersResult.rows,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
