import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const result = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: result,
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
      product_code,
      product_name,
      category,
      base_price,
      available_colors,
      available_sizes,
      description,
      is_active,
    } = data;

    const result = await prisma.product.update({
      where: { id: productId },
      data: {
        product_code,
        product_name,
        category,
        base_price,
        available_colors: available_colors || [],
        available_sizes: available_sizes || [],
        description,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return NextResponse.json({
      success: true,
      product: result,
      message: "Product updated successfully",
    });
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

    // Soft delete by setting is_active to false
    const result = await prisma.product.update({
      where: { id: productId },
      data: {
        is_active: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: result,
    });
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
