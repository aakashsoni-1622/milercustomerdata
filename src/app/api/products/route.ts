import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products - Get all active products
export async function GET() {
  try {
    const result = await prisma.product.findMany({
      where: {
        is_active: true,
      },
    });

    return NextResponse.json({
      success: true,
      products: result,
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
      product_code,
      product_name,
      category,
      base_price,
      available_colors,
      available_sizes,
      description,
    } = data;
    // Validate required fields
    if (!product_code || !product_name) {
      return NextResponse.json(
        {
          success: false,
          error: "Product code and name are required",
        },
        { status: 400 }
      );
    }

    const result = await prisma.product.create({
      data: {
        base_price: base_price,
        available_colors: available_colors,
        available_sizes: available_sizes,
        description: description,
        product_code,
        product_name,
        category,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      product: result,
      message: "Product created successfully",
    });
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
