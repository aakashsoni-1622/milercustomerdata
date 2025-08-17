import { NextResponse } from "next/server";
import { syncOrders } from "@/lib/order-utils";

export async function POST() {
  try {
    const result = await syncOrders();
    return NextResponse.json({ success: true, message: result });
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
