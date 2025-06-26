import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const ordersData = await request.json();
    const results = [];
    const errors = [];

    for (const orderData of ordersData) {
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

      if (contact_no) {
        // Append '91' to contact_no if it doesn't start with '91'
        const formattedContactNo = contact_no.startsWith("91")
          ? Number(contact_no)
          : Number(`91${contact_no}`);

        const dateParts = orderDetails.date.split("/");
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        try {
          // Check if customer exists, if not create a new customer
          let customerId;
          const customerResult = await pool.query(
            "SELECT id FROM miler.customers WHERE contact_no = $1",
            [formattedContactNo]
          );
          if (customerResult.rows.length === 0) {
            const newCustomerResult = await pool.query(
              "INSERT INTO miler.customers (customer_name, contact_no, email, address, city, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
              [customer_name, formattedContactNo, email, address, city, country]
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
              `INSERT INTO miler.orders (
              order_id, date, state, item, color1, color2, color3, size, qty, amount, payment_mode, customer_id,
              payment_received, order_confirmation, reason, process_order, order_packed, order_cancelled, delivered, is_rto,
              remarks, rto_reason, review_taken, customer_review, product_review, is_return, whatsapp_notification_failed_reason
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27
            ) RETURNING *`,
              [
                order_id,
                formattedDate,
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
                orderDetails.payment_received || false,
                orderDetails.order_confirmation || null,
                orderDetails.reason || null,
                orderDetails.process_order || false,
                orderDetails.order_packed || false,
                orderDetails.order_cancelled || false,
                orderDetails.delivered || false,
                orderDetails.rtor || false,
                orderDetails.to_received || null,
                orderDetails.rto_reason || null,
                orderDetails.review_taken || null,
                orderDetails.customer_review || null,
                orderDetails.product_review || null,
                orderDetails.return || false,
                orderDetails.whatsapp_notification_failed_reason || null,
              ]
            );
            results.push(newOrderResult.rows[0]);
          } else {
            const updateResult = await pool.query(
              `UPDATE miler.orders 
             SET date = $1, state = $2, item = $3, color1 = $4, color2 = $5, color3 = $6, size = $7, qty = $8, amount = $9, payment_mode = $10, customer_id = $11,
                 payment_received = $12, order_confirmation = $13, reason = $14, process_order = $15, order_packed = $16, order_cancelled = $17, delivered = $18, rtor = $19,
                 to_received = $20, rto_reason = $21, review_taken = $22, customer_review = $23, product_review = $24, return = $25, whatsapp_notification_failed_reason = $26
             WHERE order_id = $27
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
                orderDetails.payment_received || false,
                orderDetails.order_confirmation || null,
                orderDetails.reason || null,
                orderDetails.process_order || false,
                orderDetails.order_packed || false,
                orderDetails.order_cancelled || false,
                orderDetails.delivered || false,
                orderDetails.rtor || false,
                orderDetails.to_received || null,
                orderDetails.rto_reason || null,
                orderDetails.review_taken || null,
                orderDetails.customer_review || null,
                orderDetails.product_review || null,
                orderDetails.return || false,
                orderDetails.whatsapp_notification_failed_reason || null,
                order_id,
              ]
            );
            results.push(updateResult.rows[0]);
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            errors.push({
              customer_name,
              contact_no: formattedContactNo,
              order_id,
              reason: error.message,
              stack: error,
            });
          } else {
            errors.push({
              customer_name,
              contact_no: formattedContactNo,
              order_id,
              reason: "Unknown error occurred",
              stack: error,
            });
          }
        }
      } else {
        errors.push({
          customer_name,
          contact_no: contact_no,
          order_id,
          reason: "Contact number is required",
        });
      }
    }

    return NextResponse.json({ results, errors });
  } catch (error) {
    console.error("Error bulk inserting orders:", error);
    return NextResponse.json(
      { error: "Failed to bulk insert orders" },
      { status: 500 }
    );
  }
}
