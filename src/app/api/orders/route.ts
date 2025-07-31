import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT * FROM miler.orders ORDER BY created_at DESC"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const orders = await request.json();

    const results = await withTransaction(async (client) => {
      const insertResults = [];
      for (const order of orders) {
        const {
          order_id,
          date,
          state,
          item,
          color1,
          size,
          qty,
          amount,
          payment_mode,
          customer_id,
        } = order;
        const result = await client.query(
          "INSERT INTO orders (order_id, date, state, item, color1, size, qty, amount, payment_mode, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
          [
            order_id,
            date,
            state,
            item,
            color1,
            size,
            qty,
            amount,
            payment_mode,
            customer_id,
          ]
        );
        insertResults.push(result.rows[0]);
      }
      return insertResults;
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error bulk inserting orders:", error);
    return NextResponse.json(
      { error: "Failed to bulk insert orders" },
      { status: 500 }
    );
  }
}
