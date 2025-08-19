import { NextResponse } from "next/server";
import {
  syncOrders,
  syncOrdersInBatches,
  getRateLimiterStatus,
} from "@/lib/order-utils";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const useBatch = searchParams.get("batch") === "true";
    const batchSize = parseInt(searchParams.get("batchSize") || "10");

    // Get current rate limiter status
    const rateLimiterStatus = getRateLimiterStatus();

    let result: string;
    if (useBatch) {
      console.log(`Starting batch sync with batch size: ${batchSize}`);
      result = await syncOrdersInBatches(batchSize);
    } else {
      console.log("Starting regular sync");
      result = await syncOrders();
    }

    return NextResponse.json({
      success: true,
      message: result,
      rateLimiterStatus,
      syncType: useBatch ? "batch" : "regular",
      batchSize: useBatch ? batchSize : undefined,
    });
  } catch (error) {
    console.error("Error syncing orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check rate limiter status
export async function GET() {
  try {
    const rateLimiterStatus = getRateLimiterStatus();
    return NextResponse.json({
      success: true,
      rateLimiterStatus,
    });
  } catch (error) {
    console.error("Error getting rate limiter status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get rate limiter status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
