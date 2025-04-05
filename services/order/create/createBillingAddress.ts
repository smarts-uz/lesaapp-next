import { PrismaClient } from "@prisma/client";

interface Customer {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface TransactionClient {
  wp_wc_order_addresses: {
    create: Function;
  };
}

export async function createBillingAddress({
  tx,
  customer,
  orderId,
}: {
  tx: TransactionClient;
  customer: Customer;
  orderId: bigint;
}) {
  return await tx.wp_wc_order_addresses.create({
    data: {
      order_id: orderId,
      address_type: "billing",
      first_name: customer.firstName || null,
      last_name: customer.lastName || null,
      phone: customer.phone || null,
      email: customer.email || null,
      address_1: customer.address || null,
      city: customer.city || null,
      country: customer.country || null,
    },
  });
} 