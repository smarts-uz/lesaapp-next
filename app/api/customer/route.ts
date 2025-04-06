import { NextResponse } from "next/server";
import { 
  fetchCustomerById, 
  fetchAllCustomers, 
  createCustomer,
  CustomerData 
} from "@/services/customer";

/**
 * Gets all customers or a specific customer by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // If ID is provided, get a specific customer
    if (id) {
      try {
        const customer = await fetchCustomerById(id);
        return NextResponse.json(customer);
      } catch (error) {
        if ((error as Error).message === "Customer not found") {
          return NextResponse.json(
            { error: "Customer not found" },
            { status: 404 },
          );
        }
        throw error;
      }
    }
    // Otherwise, get all customers with pagination
    else {
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      
      const result = await fetchAllCustomers(page, limit);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch customers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Creates a new customer in WooCommerce/WordPress
 */
export async function POST(request: Request) {
  try {
    const data: CustomerData = await request.json();

    // Input validation - now includes phone
    if (
      !data.username ||
      !data.password ||
      !data.email ||
      !data.firstName ||
      !data.lastName ||
      !data.phone
    ) {
      return NextResponse.json(
        {
          error: "Required fields missing",
          requiredFields: [
            "username",
            "password",
            "email",
            "firstName",
            "lastName",
            "phone",
          ],
        },
        { status: 400 },
      );
    }

    try {
      const customer = await createCustomer(data);
      
      return NextResponse.json({
        success: true,
        customer
      });
    } catch (error) {
      if ((error as Error).message === "User with this username or email already exists") {
        return NextResponse.json(
          { error: "User with this username or email already exists" },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
