import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const {
      order_id,
      contact_no,
      customer_name,
      email,
      address,
      city,
      country,
      ...orderDetails
    } = orderData;

    // Check if customer exists, if not create a new customer
    let customerId;
    const customerResult = await pool.query(
      "SELECT id FROM miler.customers WHERE contact_no = $1",
      [contact_no]
    );
    if (customerResult.rows.length === 0) {
      const newCustomerResult = await pool.query(
        "INSERT INTO miler.customers (customer_name, contact_no, email, address, city, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [customer_name, contact_no, email, address, city, country]
      );
      customerId = newCustomerResult.rows[0].id;
    } else {
      customerId = customerResult.rows[0].id;
    }

    // Check if order exists, if not create a new order
    const orderResult = await pool.query(
      "SELECT id FROM miler.orders WHERE order_id = $1",
      [order_id]
    );
    if (orderResult.rows.length === 0) {
      const newOrderResult = await pool.query(
        `INSERT INTO miler.orders (order_id, date, state, item, color1, color2, color3, size, qty, amount, payment_mode, customer_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          order_id,
          orderDetails.date,
          orderDetails.state,
          orderDetails.item,
          orderDetails.color1,
          orderDetails.color2,
          orderDetails.color3,
          orderDetails.size,
          orderDetails.qty,
          orderDetails.amount,
          orderDetails.payment_mode,
          customerId,
        ]
      );
      return NextResponse.json(newOrderResult.rows[0]);
    }

    // Update existing order details
    const updateResult = await pool.query(
      `UPDATE miler.orders 
       SET date = $1, state = $2, item = $3, color1 = $4, color2 = $5, color3 = $6, size = $7, qty = $8, amount = $9, payment_mode = $10, customer_id = $11
       WHERE order_id = $12
       RETURNING *`,
      [
        orderDetails.date,
        orderDetails.state,
        orderDetails.item,
        orderDetails.color1,
        orderDetails.color2,
        orderDetails.color3,
        orderDetails.size,
        orderDetails.qty,
        orderDetails.amount,
        orderDetails.payment_mode,
        customerId,
        order_id,
      ]
    );

    return NextResponse.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
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
      UPDATE miler.orders 
      SET ${updateFields}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Order updated successfully",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
