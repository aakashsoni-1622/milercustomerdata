import { ALL_CUSTOMERS } from "@/lib/customers-data";
import { prisma } from "./prisma";
import type { ShopifyOrder, LineItem, SimpleOrderItem } from "@/types/shopify";
import { shopifyApi } from "./shopify-api";

interface OrderVariables {
  orderId: string;
  customerName: string;
  address?: string;
  city?: string;
  country?: string;
  contactNo: string;
  date?: string;
  state?: string;
  orderItems: any[];
  totalAmount?: number;
  paymentMode?: string;
  orderConfirmation?: string;
  comments?: string;
  orderStatus?: string;
  processOrder?: boolean;
  orderPacked?: boolean;
  rtoReceived?: boolean;
  damaged?: boolean;
  reviewTaken?: string;
  customerReview?: string;
  productReview?: string;
  isReturn?: boolean;
  returnReason?: string;
  returnInitiated?: boolean;
  returnPicked?: boolean;
  returnDelivered?: boolean;
  shippingAdjustment?: string;
  returnStatus?: string;
  exchangeStatus?: string;
  whatsappNotificationFailedReason?: string;
  meta_data?: any;
  email?: string;
  shopifyCustomerId?: string;
  trackingUrl?: string;
}

export async function createOrUpdateOrder(
  variables: OrderVariables,
  isShopifyWebhook = false
) {
  try {
    // 1. Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { contact_no: variables.contactNo },
          { shopify_customer_id: variables.shopifyCustomerId },
        ],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          customer_name: variables.customerName,
          contact_no: variables.contactNo,
          shopify_customer_id: variables.shopifyCustomerId as any,
          state: variables.state,
          email: variables.email,
          address: variables.address,
          city: variables.city,
          country: variables.country,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          customer_name: variables.customerName,
          contact_no: variables.contactNo,
          shopify_customer_id: variables.shopifyCustomerId,
          state: variables.state,
          email: variables.email,
        },
      });
    }

    // 2. Calculate total amount and validate products
    let totalAmount;
    let validatedOrderItems;

    if (isShopifyWebhook) {
      // Shopify webhook logic
      totalAmount = variables.totalAmount || 0;
      validatedOrderItems = [];

      for (const item of variables.orderItems) {
        // Get product details
        const product = await prisma.product.findFirst({
          where: {
            product_code: item.productCode,
            is_active: true,
          },
        });

        if (!product) {
          throw new Error(
            `Product with ID ${item.productCode} not found or inactive`
          );
        }

        validatedOrderItems.push({
          ...item,
          productId: product.id,
          selectedColors: [item.selectedColors.trim()],
          selectedSizes: [item.selectedSizes.trim()],
          quantity: 1,
          unitPrice: parseFloat(item.totalPrice),
        });
      }
    } else {
      // Simple order data logic
      totalAmount = variables.totalAmount || 0;
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
    const existingOrder = await prisma.order.findUnique({
      where: { order_id: variables.orderId },
      select: {
        id: true,
      },
    });

    let order;
    let isUpdate = false;

    if (existingOrder) {
      // Order exists, update it
      order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          customer_id: customer.id,
          order_date: variables.date ? new Date(variables.date) : null,
          state: variables.state,
          total_amount: totalAmount,
          payment_mode: variables.paymentMode,
          order_confirmation: variables.orderConfirmation || "",
          order_status: variables.orderStatus || "New",
          comments: variables.comments || "",
          process_order: variables.processOrder || false,
          order_packed: variables.orderPacked || false,
          rto_received: variables.rtoReceived || false,
          damaged: variables.damaged || false,
          review_taken: variables.reviewTaken || "",
          customer_review: variables.customerReview || "",
          product_review: variables.productReview || "",
          is_return: variables.isReturn || false,
          return_reason: variables.returnReason || "",
          return_initiated: variables.returnInitiated || false,
          return_picked: variables.returnPicked || false,
          return_delivered: variables.returnDelivered || false,
          shipping_adjustment: variables.shippingAdjustment || "",
          return_status: variables.returnStatus || "",
          exchange_status: variables.exchangeStatus || "",
          whatsapp_notification_failed_reason:
            variables.whatsappNotificationFailedReason || "",
          meta_data: (variables.meta_data as object) || {},
          tracking_url: variables.trackingUrl || "",
        },
      });
      isUpdate = true;

      // Delete existing order items to recreate them
      await prisma.orderItem.deleteMany({
        where: { order_id: order.id },
      });
    } else {
      // Order doesn't exist, create new one
      order = await prisma.order.create({
        data: {
          order_id: variables.orderId,
          customer_id: customer.id,
          order_date: variables.date ? new Date(variables.date) : null,
          state: variables.state,
          total_amount: totalAmount,
          payment_mode: variables.paymentMode,
          order_confirmation: variables.orderConfirmation || "",
          order_status: variables.orderStatus || "New",
          comments: variables.comments || "",
          process_order: variables.processOrder || false,
          order_packed: variables.orderPacked || false,
          rto_received: variables.rtoReceived || false,
          damaged: variables.damaged || false,
          review_taken: variables.reviewTaken || "",
          customer_review: variables.customerReview || "",
          product_review: variables.productReview || "",
          is_return: variables.isReturn || false,
          return_reason: variables.returnReason || "",
          return_initiated: variables.returnInitiated || false,
          return_picked: variables.returnPicked || false,
          return_delivered: variables.returnDelivered || false,
          shipping_adjustment: variables.shippingAdjustment || "",
          return_status: variables.returnStatus || "",
          exchange_status: variables.exchangeStatus || "",
          whatsapp_notification_failed_reason:
            variables.whatsappNotificationFailedReason || "",
          meta_data: (variables.meta_data as object) || {},
          tracking_url: variables.trackingUrl || "",
        },
      });
    }

    // 4. Create order items
    for (const item of validatedOrderItems) {
      await prisma.orderItem.create({
        data: {
          order_id: order.id,
          product_id: item.productId,
          selected_colors: item.selectedColors,
          selected_sizes: item.selectedSizes,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity,
        },
      });
    }

    // 5. Get complete order details
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      success: true,
      order: completeOrder,
      isUpdate,
      message: isUpdate
        ? "Order updated successfully"
        : "Order created successfully",
    };
  } catch (error) {
    console.error("Database error:", error);
    throw new Error(
      `Database operation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function prepareShopifyOrderData(
  shopifyData: ShopifyOrder
): OrderVariables {
  return {
    email: shopifyData.customer.email,
    shopifyCustomerId: shopifyData.customer.id.toString(),
    orderId: shopifyData.order_number.toString(),
    customerName:
      shopifyData.customer.first_name + " " + shopifyData.customer.last_name ||
      "default",
    contactNo:
      shopifyData?.phone || shopifyData?.billing_address?.phone || "default",
    date: shopifyData?.created_at,
    state: shopifyData?.customer?.default_address?.province || "",
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
    totalAmount: shopifyData.total_price,
    paymentMode:
      shopifyData.payment_gateway_names[0] === "cash_on_delivery"
        ? "COD"
        : "PAID",
    comments: shopifyData.note,
    orderStatus: shopifyData?.fulfillment_status,
    meta_data: shopifyData,
  };
}

export function prepareCustomShopifyOrderData(
  shopifyData: any,
  orderData: ShopifyOrder
): OrderVariables {
  return {
    email: shopifyData.Email,
    shopifyCustomerId: shopifyData["Customer ID"]?.toString(),
    orderId: orderData.order_number.toString(),
    customerName:
      shopifyData["First Name"] + " " + shopifyData["Last Name"] || "default",
    address: shopifyData["Default Address Address1"],
    city: shopifyData["Default Address City"],
    country: shopifyData["Default Address Country Code"],
    date: orderData.created_at,
    contactNo:
      shopifyData?.Phone || shopifyData["Default Address Phone"]?.toString(),
    state:
      orderData.customer.default_address?.province ||
      shopifyData["Default Address Province Code"] ||
      "",
    orderItems: orderData.line_items
      .map((ele: any) => {
        const productCode = ele?.sku?.includes("MTRA04")
          ? "MTRA04"
          : ele?.sku?.includes("MTSH09")
          ? "MTSH09"
          : ele?.sku?.includes("MTSH06")
          ? "MTSH06"
          : ele?.sku?.includes("MPYJ02")
          ? "MPYJ02"
          : ele?.sku?.includes("MSHR05")
          ? "MSHR05"
          : null;
        if (productCode) {
          return {
            productCode: productCode,
            selectedColors: ele.variant_title.split("/")[0],
            selectedSizes: ele.variant_title.split("/")[1],
            totalPrice: ele.price,
          };
        } else {
          return null;
        }
      })
      .filter((ele: any) => ele !== null && ele !== undefined),
    totalAmount: orderData.total_price,
    paymentMode:
      orderData.payment_gateway_names[0] === "cash_on_delivery"
        ? "COD"
        : "PAID",
    comments: "",
    orderStatus: (() => {
      const shipmentStatus = orderData?.fulfillments?.[0]?.shipment_status;
      if (shipmentStatus && SHIPMENT_STATUS_REVERSE[shipmentStatus]) {
        return SHIPMENT_STATUS_REVERSE[shipmentStatus];
      }
      return orderData.fulfillment_status || "New";
    })(),
    trackingUrl: orderData?.fulfillments?.[0]?.tracking_url,
    meta_data: orderData,
  };
}

export function prepareSimpleOrderData(data: any): OrderVariables {
  return {
    orderId: data.orderId.toString(),
    customerName: data.customerName,
    contactNo: data.contactNo.toString(),
    date: data?.date,
    state: data?.state,
    orderItems: data.orderItems || [],
    totalAmount: data.totalAmount || 0,
    paymentMode: data.paymentMode || "PAID",
    orderConfirmation: data.orderConfirmation || "",
    comments: data.comments || "",
    orderStatus: data.orderStatus || "New",
    // Additional fields for admin/super admin
    processOrder: data.processOrder || false,
    orderPacked: data.orderPacked || false,
    rtoReceived: data.rtoReceived || false,
    damaged: data.damaged || false,
    reviewTaken: data.reviewTaken || "",
    customerReview: data.customerReview || "",
    productReview: data.productReview || "",
    isReturn: data.isReturn || false,
    returnReason: data.returnReason || "",
    returnInitiated: data.returnInitiated || false,
    returnPicked: data.returnPicked || false,
    returnDelivered: data.returnDelivered || false,
    shippingAdjustment: data.shippingAdjustment || "",
    returnStatus: data.returnStatus || "",
    exchangeStatus: data.exchangeStatus || "",
    whatsappNotificationFailedReason:
      data.whatsappNotificationFailedReason || "",
  };
}

export const SHIPMENT_STATUS = {
  LABEL_PRINTED: "label_printed",
  LABEL_PURCHASED: "label_purchased",
  AttemptedDelivery: "attempted_delivery",
  ReadyForPickup: "ready_for_pickup",
  Confirmed: "confirmed",
  InTransit: "in_transit",
  OutForDelivery: "out_for_delivery",
  Delivered: "delivered",
  Failure: "failure",
} as const;

// Reverse mapping for easier lookup
export const SHIPMENT_STATUS_REVERSE = Object.entries(SHIPMENT_STATUS).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

// Advanced rate limiting for Shopify API (2 calls per second limit)
class ShopifyRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;
  private readonly minInterval: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    callsPerSecond: number = 2,
    maxRetries: number = 3,
    retryDelay: number = 5000
  ) {
    this.minInterval = 1000 / callsPerSecond; // Convert calls per second to milliseconds
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;

      if (timeSinceLastCall < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastCall;
        console.log(
          `Rate limiting: waiting ${waitTime}ms before next API call...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const task = this.queue.shift();
      if (task) {
        this.lastCallTime = Date.now();
        await task();
      }
    }

    this.processing = false;
  }

  // Get current queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      lastCallTime: this.lastCallTime,
      minInterval: this.minInterval,
    };
  }
}

// Create rate limiter with conservative settings (1.5 calls per second to be safe)
const shopifyRateLimiter = new ShopifyRateLimiter(1.5, 3, 5000);

// Export rate limiter status for monitoring
export const getRateLimiterStatus = () => {
  return shopifyRateLimiter.getStatus();
};

// Function to pause sync if needed
export const pauseSync = () => {
  // This could be implemented to pause the current sync operation
  console.log(
    "Sync pause requested - this will take effect after current operation completes"
  );
};

export const syncOrders = async () => {
  console.log(`Starting order sync for ${ALL_CUSTOMERS.length} customers...`);

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < ALL_CUSTOMERS.length; i++) {
    const customer = ALL_CUSTOMERS[i];
    const progress = (((i + 1) / ALL_CUSTOMERS.length) * 100).toFixed(1);
    console.log(
      `[${progress}%] Processing customer ${i + 1}/${ALL_CUSTOMERS.length}: ${
        customer["Customer ID"]
      }`
    );

    try {
      const customerOrders = await shopifyRateLimiter.execute(() =>
        shopifyApi.getCustomerOrders(customer["Customer ID"], 100)
      );

      if (customerOrders.orders && customerOrders.orders.length > 0) {
        console.log(
          `  Found ${customerOrders.orders.length} orders for customer ${customer["Customer ID"]}`
        );

        for (let j = 0; j < customerOrders.orders.length; j++) {
          const order = customerOrders.orders[j];
          const orderProgress = (
            ((j + 1) / customerOrders.orders.length) *
            100
          ).toFixed(1);
          console.log(
            `    [${orderProgress}%] Processing order ${j + 1}/${
              customerOrders.orders.length
            }: ${order.id}`
          );

          try {
            const variables = prepareCustomShopifyOrderData(
              customer,
              order as any
            );
            if (variables.orderItems.length > 0) {
              await createOrUpdateOrder(variables, true);
            }
          } catch (orderError) {
            console.error(
              `    Error processing order ${order.id}:`,
              orderError
            );
            errorCount++;
            // Continue with next order
            continue;
          }
        }
        successCount++;
      } else {
        console.log(
          `  No orders found for customer ${customer["Customer ID"]}`
        );
        successCount++;
      }
    } catch (error) {
      console.error(
        `  Error processing customer ${customer["Customer ID"]}:`,
        error
      );
      errorCount++;

      // If it's a rate limit error, wait longer before continuing
      if (error instanceof Error && error.message.includes("429")) {
        console.log(
          "  Rate limit hit, waiting 10 seconds before continuing..."
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      // Continue with next customer instead of failing completely
      continue;
    }

    // Log progress every 10 customers
    if ((i + 1) % 10 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `  Progress: ${i + 1}/${
          ALL_CUSTOMERS.length
        } customers processed in ${elapsed}s`
      );
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Order sync completed in ${totalTime}s`);
  console.log(
    `Results: ${successCount} customers processed successfully, ${errorCount} errors`
  );

  return `Orders synced successfully. Processed ${successCount} customers in ${totalTime}s with ${errorCount} errors.`;
};

// Batch processing version for large datasets
export const syncOrdersInBatches = async (batchSize: number = 10) => {
  console.log(
    `Starting batch order sync for ${ALL_CUSTOMERS.length} customers in batches of ${batchSize}...`
  );

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (
    let batchStart = 0;
    batchStart < ALL_CUSTOMERS.length;
    batchStart += batchSize
  ) {
    const batchEnd = Math.min(batchStart + batchSize, ALL_CUSTOMERS.length);
    const batch = ALL_CUSTOMERS.slice(batchStart, batchEnd);

    console.log(
      `\nProcessing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(
        ALL_CUSTOMERS.length / batchSize
      )} (customers ${batchStart + 1}-${batchEnd})`
    );

    // Process batch with rate limiting
    for (let i = 0; i < batch.length; i++) {
      const customer = batch[i];
      const globalIndex = batchStart + i;
      const progress = (
        ((globalIndex + 1) / ALL_CUSTOMERS.length) *
        100
      ).toFixed(1);

      console.log(
        `[${progress}%] Processing customer ${globalIndex + 1}/${
          ALL_CUSTOMERS.length
        }: ${customer["Customer ID"]}`
      );

      try {
        const customerOrders = await shopifyRateLimiter.execute(() =>
          shopifyApi.getCustomerOrders(customer["Customer ID"], 100)
        );

        if (customerOrders.orders && customerOrders.orders.length > 0) {
          console.log(
            `  Found ${customerOrders.orders.length} orders for customer ${customer["Customer ID"]}`
          );

          for (const order of customerOrders.orders) {
            try {
              const variables = prepareCustomShopifyOrderData(
                customer,
                order as any
              );
              if (variables.orderItems.length > 0) {
                await createOrUpdateOrder(variables, true);
              }
            } catch (orderError) {
              console.error(
                `    Error processing order ${order.id}:`,
                orderError
              );
              errorCount++;
            }
          }
          successCount++;
        } else {
          console.log(
            `  No orders found for customer ${customer["Customer ID"]}`
          );
          successCount++;
        }
      } catch (error) {
        console.error(
          `  Error processing customer ${customer["Customer ID"]}:`,
          error
        );
        errorCount++;

        if (error instanceof Error && error.message.includes("429")) {
          console.log(
            "  Rate limit hit, waiting 15 seconds before continuing..."
          );
          await new Promise((resolve) => setTimeout(resolve, 15000));
        }
      }
    }

    // Add a small delay between batches to be extra safe
    if (batchEnd < ALL_CUSTOMERS.length) {
      console.log("  Batch completed, waiting 2 seconds before next batch...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nBatch order sync completed in ${totalTime}s`);
  console.log(
    `Results: ${successCount} customers processed successfully, ${errorCount} errors`
  );

  return `Orders synced successfully in batches. Processed ${successCount} customers in ${totalTime}s with ${errorCount} errors.`;
};
