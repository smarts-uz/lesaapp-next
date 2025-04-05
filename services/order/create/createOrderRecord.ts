import { PrismaClient } from "@prisma/client";

interface CreateOrderParams {
  tx: any;
  customerId?: number | null;
  email?: string | null;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodTitle: string;
  ipAddress: string;
  userAgent: string;
}

export const createOrderRecord = async ({
  tx,
  customerId,
  email,
  status,
  totalAmount,
  paymentMethod,
  paymentMethodTitle,
  ipAddress,
  userAgent,
}: CreateOrderParams) => {
  return tx.wp_wc_orders.create({
    data: {
      id: BigInt(Math.floor(Date.now() / 1000)), // Generate a timestamp-based ID
      status,
      currency: "UZS",
      type: "shop_order",
      tax_amount: 0,
      total_amount: totalAmount,
      customer_id: customerId ? BigInt(customerId) : BigInt(0),
      billing_email: email || null,
      date_created_gmt: new Date(),
      date_updated_gmt: new Date(),
      parent_order_id: BigInt(0),
      payment_method: paymentMethod,
      payment_method_title: paymentMethodTitle,
      transaction_id: "",
      ip_address: ipAddress,
      user_agent: userAgent,
      customer_note: "",
    },
  });
}; 