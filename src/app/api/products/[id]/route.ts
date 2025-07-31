import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/products/[id] - Get single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT * FROM miler.products WHERE id = $1
    `,
      [productId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const data = await request.json();

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const {
      productCode,
      productName,
      category,
      basePrice,
      availableColors,
      availableSizes,
      description,
      isActive,
    } = data;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        UPDATE miler.products SET
          product_code = $1,
          product_name = $2,
          category = $3,
          base_price = $4,
          available_colors = $5,
          available_sizes = $6,
          description = $7,
          is_active = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `,
        [
          productCode,
          productName,
          category,
          parseFloat(basePrice) || null,
          availableColors || [],
          availableSizes || [],
          description,
          isActive !== undefined ? isActive : true,
          productId,
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        product: result.rows[0],
        message: "Product updated successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Soft delete by setting is_active to false
      const result = await client.query(
        `
        UPDATE miler.products SET
          is_active = false,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
        [productId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Product deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
