import { NextResponse } from "next/server";
import {
  fetchCustomerById,
  fetchAllCustomers,
  createCustomer,
  CustomerData,
} from "@/services/customer/create";
import {
  updateCustomerClientType,
  updateCustomerBlacklist,
} from "@/services/customer/update";

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
            { status: 404 }
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
      { status: 500 }
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
        { status: 400 }
      );
    }

    try {
      const customer = await createCustomer(data);

      return NextResponse.json({
        success: true,
        customer,
      });
    } catch (error) {
      if (
        (error as Error).message ===
        "User with this username or email already exists"
      ) {
        return NextResponse.json(
          { error: "User with this username or email already exists" },
          { status: 409 }
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
      { status: 500 }
    );
  }
}

/**
 * Updates a customer's properties in WordPress
 */
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Handle blacklist update action
    if (action === "update-blacklist") {
      try {
        const data = await request.json();

        // Validate blacklist status
        if (data.blacklist === undefined) {
          return NextResponse.json(
            { error: "blacklist status is required" },
            { status: 400 }
          );
        }

        // Ensure it's a boolean
        const blacklistStatus = Boolean(data.blacklist);

        const updatedCustomer = await updateCustomerBlacklist(
          id,
          blacklistStatus
        );

        return NextResponse.json({
          success: true,
          customer: updatedCustomer,
        });
      } catch (error) {
        if ((error as Error).message === "Customer not found") {
          return NextResponse.json(
            { error: "Customer not found" },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // Handle client_type update (default action)
    const data = await request.json();

    // Validate client_type
    if (!data.client_type) {
      return NextResponse.json(
        { error: "client_type is required" },
        { status: 400 }
      );
    }

    const validTypes = ["great", "good", "bad"] as const;
    if (!validTypes.includes(data.client_type)) {
      return NextResponse.json(
        {
          error: "Invalid client_type",
          message: "client_type must be one of: great, good, bad",
        },
        { status: 400 }
      );
    }

    try {
      const updatedCustomer = await updateCustomerClientType(
        id,
        data.client_type
      );

      return NextResponse.json({
        success: true,
        customer: updatedCustomer,
      });
    } catch (error) {
      if ((error as Error).message === "Customer not found") {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
