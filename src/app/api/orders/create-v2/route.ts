import { NextResponse } from "next/server";
import {
  createOrUpdateOrder,
  prepareShopifyOrderData,
  prepareSimpleOrderData,
} from "@/lib/order-utils";
import type { ShopifyOrder } from "@/types/shopify";

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
      variables = prepareShopifyOrderData(shopifyData);
    } else {
      // Handle simple order data from Orders Management page
      variables = prepareSimpleOrderData(data);
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

    try {
      // Use the common order creation/update function
      const result = await createOrUpdateOrder(variables, isShopifyWebhook);

      return NextResponse.json(result);
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Database operation failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
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
