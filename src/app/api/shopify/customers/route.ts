import { NextRequest, NextResponse } from "next/server";
import { shopifyApi } from "@/lib/shopify-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const limit = parseInt(searchParams.get("limit") || "50");
    const pageInfo = searchParams.get("page_info") || undefined;
    const search = searchParams.get("search") || undefined;

    let response;

    if (search) {
      // Search customers
      response = await shopifyApi.searchCustomers(search, limit);
    } else {
      // Get customers with pagination
      response = await shopifyApi.getCustomers(limit, pageInfo);
    }
    return NextResponse.json({
      success: true,
      data: response.customers || response.data || [],
      pagination: response.pagination,
      count: (response.customers || response.data || []).length,
    });
  } catch (error) {
    console.error("Error fetching Shopify customers:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}
