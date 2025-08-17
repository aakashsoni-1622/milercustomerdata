import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  // TODO: Fetch customers from the database
  return NextResponse.json({ message: "Customers API" });
}

export async function POST(request: Request) {
  try {
    const { customer_name, contact_no, email } = await request.json();
    const result = await query(
      "INSERT INTO customers (customer_name, contact_no, email) VALUES ($1, $2, $3) RETURNING *",
      [customer_name, contact_no, email]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting customer:", error);
    return NextResponse.json(
      { error: "Failed to insert customer" },
      { status: 500 }
    );
  }
}

export const ALL_CUSTOMERS = [
  {
    "Customer ID": "10177488191766",
    "First Name": "BALANJANEYULU",
    "Last Name": "POSA",
    "Email": "posabala@gmail.com",
    "Accepts Email Marketing": "yes",
    "Default Address Company": "",
    "Default Address Address1": "202, Rajahamsa Royal Regency, First Road, George pet, Anantapur, Andhra Pradesh",
    "Default Address Address2": "",
    "Default Address City": "ANANTHAPUR",
    "Default Address Province Code": "AP",
    "Default Address Country Code": "IN",
    "Default Address Zip": "515004",
    "Default Address Phone": "7093445511",
    "Phone": "",
    "Accepts SMS Marketing": "no",
    "Total Spent": 1798.2,
    "Total Orders": 2,
    "Note": "",
    "Tax Exempt": "no",
    "Tags": ""
  }
];
