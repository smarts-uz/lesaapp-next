import { prisma } from "@/lib/prisma";

interface CustomerResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateRegistered: Date;
  lastActive: Date | null;
  billing?: {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
    email: string;
  };
  shipping?: {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

interface PaginatedCustomersResponse {
  customers: Array<{
    id: string;
    username: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateRegistered: Date;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Fetches a single customer by ID
 */
export async function fetchCustomerById(id: string): Promise<CustomerResponse> {
  const userId = BigInt(id);

  // Get user from wp_users
  const user = await prisma.wp_users.findUnique({
    where: { ID: userId },
  });

  if (!user) {
    throw new Error("Customer not found");
  }

  // Get customer metadata from wp_usermeta
  const userMeta = await prisma.wp_usermeta.findMany({
    where: { user_id: userId },
  });

  // Convert metadata array to object for easier access
  const metaObj: Record<string, string> = {};
  userMeta.forEach((meta) => {
    if (meta.meta_key && meta.meta_value) {
      metaObj[meta.meta_key] = meta.meta_value;
    }
  });

  // Get WooCommerce customer data
  const wooCustomer = await prisma.wp_wc_customer_lookup.findFirst({
    where: { user_id: userId },
  });

  const customer = {
    id: user.ID.toString(),
    username: user.user_login,
    email: user.user_email,
    displayName: user.display_name,
    firstName: metaObj["first_name"] || "",
    lastName: metaObj["last_name"] || "",
    phone:
      (user as any).phone ||
      metaObj["phone"] ||
      metaObj["billing_phone"] ||
      "",
    dateRegistered: user.user_registered,
    lastActive: wooCustomer?.date_last_active || null,
    billing: {
      firstName: metaObj["billing_first_name"] || "",
      lastName: metaObj["billing_last_name"] || "",
      company: metaObj["billing_company"] || "",
      address1: metaObj["billing_address_1"] || "",
      address2: metaObj["billing_address_2"] || "",
      city: metaObj["billing_city"] || "",
      state: metaObj["billing_state"] || "",
      postcode: metaObj["billing_postcode"] || "",
      country: metaObj["billing_country"] || "",
      phone: metaObj["billing_phone"] || "",
      email: metaObj["billing_email"] || user.user_email,
    },
    shipping: {
      firstName: metaObj["shipping_first_name"] || "",
      lastName: metaObj["shipping_last_name"] || "",
      company: metaObj["shipping_company"] || "",
      address1: metaObj["shipping_address_1"] || "",
      address2: metaObj["shipping_address_2"] || "",
      city: metaObj["shipping_city"] || "",
      state: metaObj["shipping_state"] || "",
      postcode: metaObj["shipping_postcode"] || "",
      country: metaObj["shipping_country"] || "",
    },
  };

  return customer;
}

/**
 * Fetches all customers with pagination
 */
export async function fetchAllCustomers(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedCustomersResponse> {
  const offset = (page - 1) * limit;

  // Fetch customers with a JOIN to get first and last name from the customer lookup table
  const customers = await prisma.$queryRaw<
    Array<{
      ID: bigint;
      user_login: string;
      user_email: string;
      display_name: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      date_registered: Date;
      date_last_active: Date | null;
    }>
  >`
    SELECT u.ID, u.user_login, u.user_email, u.display_name, u.phone,
           cl.first_name, cl.last_name, 
           u.user_registered as date_registered,
           cl.date_last_active
    FROM wp_users u
    LEFT JOIN wp_wc_customer_lookup cl ON u.ID = cl.user_id
    WHERE EXISTS (
      SELECT 1 FROM wp_usermeta um 
      WHERE um.user_id = u.ID 
      AND um.meta_key = 'wp_capabilities' 
      AND um.meta_value LIKE '%customer%'
    )
    ORDER BY u.user_registered DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Count total customers for pagination
  const countResult = await prisma.$queryRaw<[{ total: bigint }]>`
    SELECT COUNT(*) as total
    FROM wp_users u
    WHERE EXISTS (
      SELECT 1 FROM wp_usermeta um 
      WHERE um.user_id = u.ID 
      AND um.meta_key = 'wp_capabilities' 
      AND um.meta_value LIKE '%customer%'
    )
  `;

  const total = Number(countResult[0].total);

  // Format customer data
  const formattedCustomers = customers.map((customer) => ({
    id: customer.ID.toString(),
    username: customer.user_login,
    email: customer.user_email,
    displayName: customer.display_name,
    firstName: customer.first_name || "",
    lastName: customer.last_name || "",
    phone: customer.phone || "",
    dateRegistered: customer.date_registered,
  }));

  return {
    customers: formattedCustomers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
} 