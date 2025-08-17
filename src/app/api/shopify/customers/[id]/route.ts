import { NextRequest, NextResponse } from "next/server";
import { shopifyApi } from "@/lib/shopify-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const response = await shopifyApi.getCustomer(customerId);

    return NextResponse.json({
      success: true,
      data: response.customer,
    });
  } catch (error) {
    console.error("Error fetching Shopify customer:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch customer",
      },
      { status: 500 }
    );
  }
}
