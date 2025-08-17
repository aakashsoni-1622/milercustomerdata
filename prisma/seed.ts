import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create default products
  const defaultProducts = [
    {
      product_code: "MTSH09",
      product_name: "Raglan T-Shirt",
      category: "T-Shirt",
      base_price: 299.99,
      available_colors: [
        "Airforce Blue",
        "Royal Blue",
        "Rama Green",
        "Yellow",
        "Black",
        "White",
        "Light Gray",
        "Peach",
        "Dark Gray",
        "Navy Blue",
        "Maroon",
        "Forest Green",
        "Bottle Green",
        "Wine",
        "Sky Blue",
        "Neon",
      ],
      available_sizes: ["M", "L", "XL", "2XL", "3XL", "4XL"],
      description: "Premium quality raglan sleeve t-shirt",
      is_active: true,
    },
    {
      product_code: "MTSH06",
      product_name: "Polo T-Shirt",
      category: "Polo",
      base_price: 399.99,
      available_colors: [
        "Airforce Blue",
        "Royal Blue",
        "Rama Green",
        "Yellow",
        "Black",
        "White",
        "Light Gray",
        "Peach",
        "Dark Gray",
        "Navy Blue",
        "Maroon",
        "Forest Green",
        "Bottle Green",
        "Wine",
        "Sky Blue",
        "Neon",
      ],
      available_sizes: ["M", "L", "XL", "2XL", "3XL", "4XL"],
      description: "Classic polo t-shirt with collar",
      is_active: true,
    },
    {
      product_code: "MSHR05",
      product_name: "Athletic Short",
      category: "Shorts",
      base_price: 199.99,
      available_colors: [
        "Airforce Blue",
        "Royal Blue",
        "Rama Green",
        "Yellow",
        "Black",
        "White",
        "Light Gray",
        "Peach",
        "Dark Gray",
        "Navy Blue",
        "Maroon",
        "Forest Green",
        "Bottle Green",
        "Wine",
        "Sky Blue",
        "Neon",
      ],
      available_sizes: ["M", "L", "XL", "2XL", "3XL", "4XL"],
      description: "Comfortable athletic shorts for sports",
      is_active: true,
    },
    {
      product_code: "MPYJ02",
      product_name: "Jogger Pants",
      category: "Pants",
      base_price: 499.99,
      available_colors: [
        "Airforce Blue",
        "Royal Blue",
        "Rama Green",
        "Yellow",
        "Black",
        "White",
        "Light Gray",
        "Peach",
        "Dark Gray",
        "Navy Blue",
        "Maroon",
        "Forest Green",
        "Bottle Green",
        "Wine",
        "Sky Blue",
        "Neon",
      ],
      available_sizes: ["M", "L", "XL", "2XL", "3XL", "4XL"],
      description: "Premium jogger pants with elastic waistband",
      is_active: true,
    },
    {
      product_code: "MTRA04",
      product_name: "Track Jacket",
      category: "Jacket",
      base_price: 699.99,
      available_colors: [
        "Airforce Blue",
        "Royal Blue",
        "Rama Green",
        "Yellow",
        "Black",
        "White",
        "Light Gray",
        "Peach",
        "Dark Gray",
        "Navy Blue",
        "Maroon",
        "Forest Green",
        "Bottle Green",
        "Wine",
        "Sky Blue",
        "Neon",
      ],
      available_sizes: ["M", "L", "XL", "2XL", "3XL", "4XL"],
      description: "Lightweight track jacket with zipper",
      is_active: true,
    },
  ];

  console.log("📦 Creating default products...");
  for (const productData of defaultProducts) {
    try {
      const product = await prisma.product.upsert({
        where: { product_code: productData.product_code },
        update: productData,
        create: productData,
      });
      console.log(
        `✅ Product created/updated: ${product.product_name} (${product.product_code})`
      );
    } catch (error) {
      console.error(
        `❌ Error creating product ${productData.product_code}:`,
        error
      );
    }
  }

  // Create default super admin user
  console.log("👤 Creating default super admin user...");
  try {
    const superAdmin = await prisma.user.upsert({
      where: { username: "superadmin" },
      update: {
        email: "admin@miler.com",
        password_hash:
          "$2b$12$TMUn4dSVgJ.CXc1SmHdWLOHhYLLl3XpDBcDIHBhwKZumQ3yTlTnY.", // admin123
        first_name: "Super",
        last_name: "Admin",
        role: "SUPER_ADMIN",
        department: "IT",
        is_active: true,
      },
      create: {
        username: "superadmin",
        email: "admin@miler.com",
        password_hash:
          "$2b$12$TMUn4dSVgJ.CXc1SmHdWLOHhYLLl3XpDBcDIHBhwKZumQ3yTlTnY.", // admin123
        first_name: "Super",
        last_name: "Admin",
        role: "SUPER_ADMIN",
        department: "IT",
        is_active: true,
      },
    });
    console.log(
      `✅ Super admin user created/updated: ${superAdmin.first_name} ${superAdmin.last_name} (${superAdmin.username})`
    );
  } catch (error) {
    console.error("❌ Error creating super admin user:", error);
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
