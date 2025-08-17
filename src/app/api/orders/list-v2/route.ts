import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

    // New filter parameters
    const processOrder = searchParams.get("processOrder") || "";
    const orderPacked = searchParams.get("orderPacked") || "";
    const status = searchParams.get("status") || "";
    const date = searchParams.get("date") || "";
    const orderConfirmation = searchParams.get("orderConfirmation") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";

    // Build Prisma where conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { order_id: { contains: search, mode: "insensitive" } },
        {
          customer: {
            customer_name: { contains: search, mode: "insensitive" },
          },
        },
        { customer: { contact_no: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (customerName) {
      whereConditions.customer = {
        ...whereConditions.customer,
        customer_name: { contains: customerName, mode: "insensitive" },
      };
    }

    if (orderDate) {
      whereConditions.order_date = {
        gte: new Date(orderDate),
        lt: new Date(new Date(orderDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    if (orderStatus) {
      whereConditions.order_status = {
        contains: orderStatus,
        mode: "insensitive",
      };
    }

    if (state) {
      whereConditions.state = { contains: state, mode: "insensitive" };
    }

    if (paymentMode) {
      whereConditions.payment_mode = {
        contains: paymentMode,
        mode: "insensitive",
      };
    }

    // Add new filter conditions
    if (processOrder !== undefined && processOrder !== "") {
      whereConditions.process_order = processOrder === "true";
    }
    if (orderPacked !== undefined && orderPacked !== "") {
      whereConditions.order_packed = orderPacked === "true";
    }
    if (status) {
      whereConditions.order_status = { contains: status, mode: "insensitive" };
    }
    if (date) {
      whereConditions.order_date = { contains: date, mode: "insensitive" };
    }
    if (orderConfirmation) {
      whereConditions.order_confirmation = {
        contains: orderConfirmation,
        mode: "insensitive",
      };
    }
    if (paymentStatus) {
      whereConditions.payment_mode = {
        contains: paymentStatus,
        mode: "insensitive",
      };
    }

    // Validate sort column and build orderBy
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

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    if (validSortColumns.includes(sortBy)) {
      if (sortBy === "customer_name") {
        orderBy.customer = {
          customer_name: sortOrder.toLowerCase() as "asc" | "desc",
        };
      } else {
        (orderBy as any)[sortBy] = sortOrder.toLowerCase() as "asc" | "desc";
      }
    } else {
      orderBy.created_at = "desc";
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const total = await prisma.order.count({
      where: whereConditions,
    });

    // Get orders with relations
    const orders = await prisma.order.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            contact_no: true,
            email: true,
            address: true,
            city: true,
            country: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                product_code: true,
                product_name: true,
                category: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: orderBy,
      skip: offset,
      take: limit,
    });

    // Transform data to match the expected format
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      order_id: order.order_id,
      order_date: order.order_date,
      state: order.state,
      total_amount: order.total_amount,
      payment_mode: order.payment_mode,
      payment_received: order.payment_received,
      order_confirmation: order.order_confirmation,
      order_status: order.order_status,
      process_order: order.process_order,
      order_packed: order.order_packed,
      comments: order.comments,
      rto_received: order.rto_received,
      damaged: order.damaged,
      review_taken: order.review_taken,
      customer_review: order.customer_review,
      product_review: order.product_review,
      is_return: order.is_return,
      return_reason: order.return_reason,
      return_initiated: order.return_initiated,
      return_picked: order.return_picked,
      return_delivered: order.return_delivered,
      shipping_adjustment: order.shipping_adjustment,
      return_status: order.return_status,
      exchange_status: order.exchange_status,
      whatsapp_notification_failed_reason:
        order.whatsapp_notification_failed_reason,
      meta_data: order.meta_data,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_id: order.customer.id,
      customer_name: order.customer.customer_name,
      contact_no: order.customer.contact_no,
      email: order.customer.email,
      address: order.customer.address,
      city: order.customer.city,
      country: order.customer.country,
      order_items: order.orderItems.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_code: item.product.product_code,
        product_name: item.product.product_name,
        category: item.product.category,
        selected_colors: item.selected_colors,
        selected_sizes: item.selected_sizes,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
    }));

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
      orders: transformedOrders,
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
