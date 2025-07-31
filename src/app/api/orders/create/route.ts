import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      orderId,
      date,
      state,
      customerName,
      contactNo,
      items,
      colors,
      sizes,
      qty,
      amount,
      paymentMode,
      orderConfirmation,
      comments,
      processOrder,
    } = data;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // First, check if customer exists or create one
      let customerId;

      if (customerName && contactNo) {
        // Try to find existing customer
        const existingCustomer = await client.query(
          "SELECT id FROM miler.customers WHERE contact_no = $1",
          [contactNo]
        );

        if (existingCustomer.rows.length > 0) {
          customerId = existingCustomer.rows[0].id;
        } else {
          // Create new customer
          const newCustomer = await client.query(
            "INSERT INTO miler.customers (customer_name, contact_no) VALUES ($1, $2) RETURNING id",
            [customerName, contactNo]
          );
          customerId = newCustomer.rows[0].id;
        }
      }

      // Insert order
      const result = await client.query(
        `INSERT INTO miler.orders (
          order_id, date, state, item, color1, size, qty, amount, 
          payment_mode, order_confirmation, reason, process_order, 
          customer_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) 
        RETURNING *`,
        [
          orderId,
          date,
          state,
          items, // Store as comma-separated string
          colors, // Store as comma-separated string
          sizes, // Store as comma-separated string
          qty,
          parseFloat(amount) || 0,
          paymentMode,
          orderConfirmation,
          comments || "",
          processOrder || false,
          customerId,
        ]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        order: result.rows[0],
        message: "Order created successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
