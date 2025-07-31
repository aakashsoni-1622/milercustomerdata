import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/products - Get all active products
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        product_code,
        product_name,
        category,
        base_price,
        available_colors,
        available_sizes,
        description,
        is_active,
        created_at,
        updated_at
      FROM miler.products 
      WHERE is_active = true 
      ORDER BY product_name ASC
    `);

    return NextResponse.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      productCode,
      productName,
      category,
      basePrice,
      availableColors,
      availableSizes,
      description,
    } = data;

    // Validate required fields
    if (!productCode || !productName) {
      return NextResponse.json(
        {
          success: false,
          error: "Product code and name are required",
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO miler.products (
          product_code,
          product_name,
          category,
          base_price,
          available_colors,
          available_sizes,
          description,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `,
        [
          productCode,
          productName,
          category || null,
          parseFloat(basePrice) || null,
          availableColors || [],
          availableSizes || [],
          description || null,
        ]
      );

      return NextResponse.json({
        success: true,
        product: result.rows[0],
        message: "Product created successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          error: "Product code already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
