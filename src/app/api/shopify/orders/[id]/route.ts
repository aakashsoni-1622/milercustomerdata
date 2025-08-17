import { NextRequest, NextResponse } from "next/server";
import { shopifyApi } from "@/lib/shopify-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const response = await shopifyApi.getOrder(orderId);

    return NextResponse.json({
      success: true,
      data: response.order,
    });
  } catch (error) {
    console.error("Error fetching Shopify order:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}
