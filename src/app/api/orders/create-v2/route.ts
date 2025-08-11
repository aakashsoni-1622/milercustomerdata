import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { LineItem, ShopifyOrder } from "@/app/interface/shopifyWebhook";

interface SimpleOrderItem {
  productId: number;
  selectedColors: string[];
  selectedSizes: string[];
  quantity: number;
  unitPrice: number;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Check if this is a Shopify webhook or simple order data
    const isShopifyWebhook =
      data.customer && data.line_items && data.order_number;

    let variables;

    if (isShopifyWebhook) {
      // Handle Shopify webhook data
      const shopifyData: ShopifyOrder = data;
      variables = {
        orderId: shopifyData.order_number,
        customerName: shopifyData.customer.first_name,
        contactNo: shopifyData.phone || shopifyData.billing_address.phone,
        date: shopifyData.created_at,
        state:
          shopifyData.customer.state ||
          shopifyData.customer.default_address.province,
        orderItems: shopifyData.line_items.map((ele: LineItem) => {
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
          shopifyData.payment_gateway_names[0] === "cash_on_delivery"
            ? "COD"
            : "PAID",
        comments: shopifyData.note,
        orderStatus: shopifyData.fulfillment_status,
      };
    } else {
      // Handle simple order data from Orders Management page
      variables = {
        orderId: data.orderId,
        customerName: data.customerName,
        contactNo: data.contactNo,
        date: data.date,
        state: data.state,
        orderItems: data.orderItems || [],
        paymentMode: data.paymentMode || "PAID",
        orderConfirmation: data.orderConfirmation || "",
        comments: data.comments || "",
        orderStatus: data.orderStatus || "New",
      };
    }

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
      let totalAmount;
      let validatedOrderItems;

      if (isShopifyWebhook) {
        // Shopify webhook logic
        totalAmount = data.total_price;
        validatedOrderItems = [];

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
            quantity: 1,
            unitPrice: parseFloat(item.totalPrice),
          });
        }
      } else {
        // Simple order data logic
        totalAmount = data.totalAmount || 0;
        validatedOrderItems = variables.orderItems.map(
          (item: SimpleOrderItem) => ({
            productId: item.productId,
            selectedColors: item.selectedColors || [],
            selectedSizes: item.selectedSizes || [],
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
          })
        );
      }

      // 3. Check if order already exists
      const existingOrder = await client.query(
        "SELECT id FROM miler.orders_new WHERE order_id = $1",
        [variables.orderId]
      );

      let orderId;
      let isUpdate = false;

      if (existingOrder.rows.length > 0) {
        // Order exists, update it
        orderId = existingOrder.rows[0].id;
        isUpdate = true;

        // Update existing order
        await client.query(
          `
          UPDATE miler.orders_new SET
            customer_id = $1,
            order_date = $2,
            state = $3,
            total_amount = $4,
            payment_mode = $5,
            order_confirmation = $6,
            order_status = $7,
            comments = $8,
            updated_at = NOW()
          WHERE id = $9
        `,
          [
            customerId,
            variables.date,
            variables.state,
            totalAmount,
            variables.paymentMode,
            variables.orderConfirmation || "",
            variables.orderStatus || "New",
            variables.comments || "",
            orderId,
          ]
        );

        // Delete existing order items to recreate them
        await client.query(
          "DELETE FROM miler.order_items WHERE order_id = $1",
          [orderId]
        );
      } else {
        // Order doesn't exist, create new one
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
            variables.orderConfirmation || "",
            variables.orderStatus || "New",
            variables.comments || "",
          ]
        );
        orderId = orderResult.rows[0].id;
      }

      // 4. Create order items
      for (const item of validatedOrderItems) {
        await client.query(
          `
          INSERT INTO miler.order_items (
            order_id, product_id, selected_colors, selected_sizes, quantity, unit_price
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            orderId,
            item.productId,
            item.selectedColors,
            item.selectedSizes,
            item.quantity,
            item.unitPrice,
          ]
        );
      }

      // 5. Get complete order details
      const completeOrderResult = await client.query(
        `
        SELECT 
          o.id,
          o.order_id,
          o.order_date,
          o.state,
          o.total_amount,
          o.payment_mode,
          o.order_confirmation,
          o.order_status,
          o.comments,
          c.customer_name,
          c.contact_no,
          o.created_at,
          o.updated_at
        FROM miler.orders_new o
        JOIN miler.customers c ON o.customer_id = c.id
        WHERE o.id = $1
      `,
        [orderId]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        order: completeOrderResult.rows[0],
        message: isUpdate
          ? "Order updated successfully"
          : "Order created successfully",
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
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
