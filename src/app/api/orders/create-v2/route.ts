import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { LineItem, ShopifyOrder } from "@/app/interface/shopifyWebhook";

export async function POST(request: Request) {
  try {
    const data: ShopifyOrder = await request.json();

    const variables = {
      orderId: data.order_number,
      customerName: data.customer.first_name,
      contactNo: data.phone || data.billing_address.phone,
      date: data.created_at,
      state: data.customer.state || data.customer.default_address.province,
      orderItems: data.line_items.map((ele: LineItem) => {
        return {
          productCode: ele?.sku?.includes("MTRA04")
            ? "MTRA04"
            : ele?.sku?.includes("MTSH09")
            ? "MTSH09"
            : ele?.sku?.includes("MTSH06")
            ? "MTSH06"
            : ele?.sku?.includes("MPYJ02")
            ? "MPYJ02"
            : ele?.sku?.includes("MSHR05")
            ? "MSHR05"
            : "",
          selectedColors: ele.variant_title.split("/")[0],
          selectedSizes: ele.variant_title.split("/")[1],
          totalPrice: ele.price,
        };
      }),
      paymentMode:
        data.payment_gateway_names[0] === "cash_on_delivery" ? "COD" : "PAID",
      comments: data.note,
      orderStatus: data.fulfillment_status,
    };

    // Validate required fields
    if (
      !variables.orderId ||
      !variables.customerName ||
      !variables.contactNo ||
      !variables.orderItems ||
      variables.orderItems.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: orderId, customerName, contactNo, and orderItems are required",
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Find or create customer
      let customerId;

      const existingCustomer = await client.query(
        "SELECT id FROM miler.customers WHERE contact_no = $1",
        [variables.contactNo]
      );

      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
      } else {
        const newCustomer = await client.query(
          "INSERT INTO miler.customers (customer_name, contact_no, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id",
          [variables.customerName, variables.contactNo]
        );
        customerId = newCustomer.rows[0].id;
      }

      // 2. Calculate total amount and validate products
      const totalAmount = data.total_price;
      const validatedOrderItems = [];

      for (const item of variables.orderItems) {
        // Get product details
        const productResult = await client.query(
          "SELECT id, base_price, available_colors, available_sizes FROM miler.products WHERE product_code = $1 AND is_active = true",
          [item.productCode]
        );

        if (productResult.rows.length === 0) {
          throw new Error(
            `Product with ID ${item.productCode} not found or inactive`
          );
        }

        validatedOrderItems.push({
          ...item,
          productId: productResult.rows[0].id,
          selectedColors: [item.selectedColors.trim()],
          selectedSizes: [item.selectedSizes.trim()],
          quantity: data.line_items.find((ele: LineItem) =>
            ele.sku.includes(item.productCode)
          )?.quantity,
          unitPrice: productResult.rows[0].base_price,
          totalPrice: item.totalPrice,
        });
      }
      // 3. Create order
      const orderResult = await client.query(
        `
        INSERT INTO miler.orders_new (
          order_id, customer_id, order_date, state, total_amount,
          payment_mode, order_confirmation, order_status, comments,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id
      `,
        [
          variables.orderId,
          customerId,
          variables.date,
          variables.state,
          totalAmount,
          variables.paymentMode,
          variables.orderStatus || "New",
          variables.comments || "",
          false,
        ]
      );

      const newOrderId = orderResult.rows[0].id;

      // 4. Create order items
      const orderItemResults = [];
      for (const item of validatedOrderItems) {
        const orderItemResult = await client.query(
          `
          INSERT INTO miler.order_items (
            order_id, product_id, selected_colors, selected_sizes,
            quantity, unit_price, total_price, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `,
          [
            newOrderId,
            item.productId,
            item.selectedColors,
            item.selectedSizes,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
          ]
        );

        orderItemResults.push(orderItemResult.rows[0]);
      }

      await client.query("COMMIT");

      // 5. Fetch complete order data for response
      const completeOrderResult = await client.query(
        `
        SELECT 
          o.*,
          c.customer_name,
          c.contact_no,
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.product_name,
              'product_code', p.product_code,
              'selected_colors', oi.selected_colors,
              'selected_sizes', oi.selected_sizes,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )
          ) as order_items
        FROM miler.orders_new o
        JOIN miler.customers c ON o.customer_id = c.id
        JOIN miler.order_items oi ON o.id = oi.order_id
        JOIN miler.products p ON oi.product_id = p.id
        WHERE o.id = $1
        GROUP BY o.id, c.customer_name, c.contact_no
      `,
        [newOrderId]
      );
      console.log(completeOrderResult.rows[0]);
      return NextResponse.json({
        success: true,
        order: completeOrderResult.rows[0],
        message: "Order created successfully",
      });
    } catch (error) {
      console.log(error);
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
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
