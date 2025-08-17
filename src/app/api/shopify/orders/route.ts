import { NextRequest, NextResponse } from "next/server";
import { shopifyApi } from "@/lib/shopify-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const limit = parseInt(searchParams.get("limit") || "250");
    const pageInfo = searchParams.get("page_info") || undefined;
    const status = searchParams.get("status") || undefined;
    const customerId = searchParams.get("customer_id") || undefined;
    const fetchAll = searchParams.get("fetch_all") === "true";

    let response:
      | Awaited<ReturnType<typeof shopifyApi.getOrders>>
      | Awaited<ReturnType<typeof shopifyApi.getCustomerOrders>>;

    if (customerId) {
      // Get orders for specific customer
      response = await shopifyApi.getCustomerOrders(
        parseInt(customerId),
        limit
      );
    } else {
      // Get orders with pagination or fetch all
      response = await shopifyApi.getOrders(limit, pageInfo, status, fetchAll);
    }

    // Handle different response types
    const orders = response.orders || response.data || [];
    const count = orders.length;

    // Check if this is a regular orders response (has totalCount/hasMore)
    const hasTotalCount = "totalCount" in response;
    const hasHasMore = "hasMore" in response;

    // For customer orders, we don't have totalCount/hasMore
    if (!hasTotalCount || !hasHasMore) {
      return NextResponse.json({
        success: true,
        data: orders,
        pagination: response.pagination,
        count: count,
        message: `Fetched ${count} orders for customer`,
      });
    }

    // For regular orders, we have totalCount/hasMore
    // Type assertion since we've already checked these properties exist
    const ordersResponse = response as typeof response & {
      totalCount: number;
      hasMore: boolean;
    };

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: response.pagination,
      count: count,
      totalCount: ordersResponse.totalCount || 0,
      hasMore: ordersResponse.hasMore || false,
      message: fetchAll
        ? `Fetched all ${ordersResponse.totalCount} orders`
        : `Fetched ${count} orders${
            ordersResponse.hasMore ? " (more available)" : " (all orders)"
          }`,
    });
  } catch (error) {
    console.error("Error fetching Shopify orders:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}
