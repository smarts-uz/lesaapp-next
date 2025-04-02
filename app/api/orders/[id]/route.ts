import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define interfaces for our data structures
interface OrderAddress {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_1: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
}

interface OrderItem {
  id: number;
  name: string | null;
  sku: string | null;
  price: number | null;
  quantity: number | null;
  total: number | null;
  type: string | null;
  bundle_item_id?: number | null;
  bundle_item_name?: string | null;
  bundle_item_price?: number | null;
  bundle_item_quantity?: number | null;
  bundle_item_total?: number | null;
  selected_options?: string | null;
}

interface OrderRefund {
  id: number;
  date_created_gmt: Date | null;
  amount: number | null;
  reason: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  created_by: string | null;
  refund_type: string | null;
  items: string | null;
}

interface RawOrder {
  id: number;
  status: string | null;
  date_created_gmt: Date | null;
  total_amount: number | null;
  subtotal: number | null;
  shipping_total: number | null;
  tax_total: number | null;
  discount_total: number | null;
  payment_method: string | null;
  transaction_id: string | null;
  compatibility_warnings: string | null;
  billing_first_name: string | null;
  billing_last_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postcode: string | null;
  billing_country: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postcode: string | null;
  shipping_country: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    console.log(orderId);
    // Fetch the order from the database using a raw query
    const orderResult = await prisma.$queryRaw<RawOrder[]>`
      SELECT o.*, 
        oa_billing.first_name as billing_first_name, 
        oa_billing.last_name as billing_last_name,
        oa_billing.email as billing_email,
        oa_billing.phone as billing_phone,
        oa_billing.address_1 as billing_address,
        oa_billing.city as billing_city,
        oa_billing.state as billing_state,
        oa_billing.postcode as billing_postcode,
        oa_billing.country as billing_country,
        oa_shipping.address_1 as shipping_address,
        oa_shipping.city as shipping_city,
        oa_shipping.state as shipping_state,
        oa_shipping.postcode as shipping_postcode,
        oa_shipping.country as shipping_country
      FROM wp_wc_orders o
      LEFT JOIN wp_wc_order_addresses oa_billing ON o.id = oa_billing.order_id AND oa_billing.address_type = 'billing'
      LEFT JOIN wp_wc_order_addresses oa_shipping ON o.id = oa_shipping.order_id AND oa_shipping.address_type = 'shipping'
      WHERE o.id = ${parseInt(orderId)}
    `;

    if (!orderResult || orderResult.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const order = orderResult[0];

    // Fetch order items
    const orderItems = await prisma.$queryRaw<OrderItem[]>`
      SELECT 
        oi.order_item_id as id,
        oi.order_item_name as name,
        oim_sku.meta_value as sku,
        oim_price.meta_value as price,
        oim_qty.meta_value as quantity,
        oim_total.meta_value as total,
        oi.order_item_type as type,
        bi.bundled_item_id as bundle_item_id,
        bi_meta_name.meta_value as bundle_item_name,
        bi_meta_price.meta_value as bundle_item_price,
        bi_meta_qty.meta_value as bundle_item_quantity,
        bi_meta_total.meta_value as bundle_item_total,
        bi_meta_options.meta_value as selected_options
      FROM wp_woocommerce_order_items oi
      LEFT JOIN wp_woocommerce_order_itemmeta oim_sku ON oi.order_item_id = oim_sku.order_item_id AND oim_sku.meta_key = '_sku'
      LEFT JOIN wp_woocommerce_order_itemmeta oim_price ON oi.order_item_id = oim_price.order_item_id AND oim_price.meta_key = '_line_total'
      LEFT JOIN wp_woocommerce_order_itemmeta oim_qty ON oi.order_item_id = oim_qty.order_item_id AND oim_qty.meta_key = '_qty'
      LEFT JOIN wp_woocommerce_order_itemmeta oim_total ON oi.order_item_id = oim_total.order_item_id AND oim_total.meta_key = '_line_total'
      LEFT JOIN wp_woocommerce_bundled_items bi ON oi.order_item_id = bi.bundled_item_id
      LEFT JOIN wp_woocommerce_bundled_itemmeta bi_meta_name ON bi.bundled_item_id = bi_meta_name.bundled_item_id AND bi_meta_name.meta_key = '_title'
      LEFT JOIN wp_woocommerce_bundled_itemmeta bi_meta_price ON bi.bundled_item_id = bi_meta_price.bundled_item_id AND bi_meta_price.meta_key = '_price'
      LEFT JOIN wp_woocommerce_bundled_itemmeta bi_meta_qty ON bi.bundled_item_id = bi_meta_qty.bundled_item_id AND bi_meta_qty.meta_key = '_qty'
      LEFT JOIN wp_woocommerce_bundled_itemmeta bi_meta_total ON bi.bundled_item_id = bi_meta_total.bundled_item_id AND bi_meta_total.meta_key = '_total'
      LEFT JOIN wp_woocommerce_bundled_itemmeta bi_meta_options ON bi.bundled_item_id = bi_meta_options.bundled_item_id AND bi_meta_options.meta_key = '_selected_options'
      WHERE oi.order_id = ${parseInt(orderId)}
    `;

    // Fetch refunds - Note: This might need adjustment based on your actual refund table structure
    const refunds = await prisma.$queryRaw<OrderRefund[]>`
      SELECT 
        p.ID as id,
        p.post_date_gmt as date_created_gmt,
        pm_amount.meta_value as amount,
        pm_reason.meta_value as reason,
        pm_payment_method.meta_value as payment_method,
        pm_transaction_id.meta_value as transaction_id,
        pm_created_by.meta_value as created_by,
        pm_refund_type.meta_value as refund_type,
        pm_items.meta_value as items
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm_amount ON p.ID = pm_amount.post_id AND pm_amount.meta_key = '_refund_amount'
      LEFT JOIN wp_postmeta pm_reason ON p.ID = pm_reason.post_id AND pm_reason.meta_key = '_refund_reason'
      LEFT JOIN wp_postmeta pm_payment_method ON p.ID = pm_payment_method.post_id AND pm_payment_method.meta_key = '_refund_payment_method'
      LEFT JOIN wp_postmeta pm_transaction_id ON p.ID = pm_transaction_id.post_id AND pm_transaction_id.meta_key = '_refund_transaction_id'
      LEFT JOIN wp_postmeta pm_created_by ON p.ID = pm_created_by.post_id AND pm_created_by.meta_key = '_refund_created_by'
      LEFT JOIN wp_postmeta pm_refund_type ON p.ID = pm_refund_type.post_id AND pm_refund_type.meta_key = '_refund_type'
      LEFT JOIN wp_postmeta pm_items ON p.ID = pm_items.post_id AND pm_items.meta_key = '_refund_items'
      WHERE p.post_type = 'shop_order_refund' AND p.post_parent = ${parseInt(orderId)}
    `;

    // Format the order data
    const formattedOrder = {
      id: order.id.toString(),
      number: `#ORD-${order.id.toString().padStart(3, "0")}`,
      date: order.date_created_gmt?.toISOString() || new Date().toISOString(),
      status: order.status || "pending",
      total: Number(order.total_amount) || 0,
      subtotal: Number(order.subtotal) || 0,
      shipping_total: Number(order.shipping_total) || 0,
      tax_total: Number(order.tax_total) || 0,
      discount_total: Number(order.discount_total) || 0,
      customer: {
        name: order.billing_first_name || "Unknown",
        email: order.billing_email || "",
        phone: order.billing_phone || ""
      },
      billing: {
        address: order.billing_address || "",
        city: order.billing_city || "",
        state: order.billing_state || "",
        postcode: order.billing_postcode || "",
        country: order.billing_country || ""
      },
      shipping: {
        address: order.shipping_address || "",
        city: order.shipping_city || "",
        state: order.shipping_state || "",
        postcode: order.shipping_postcode || "",
        country: order.shipping_country || ""
      },
      payment: {
        method: order.payment_method || "Unknown",
        transaction: order.transaction_id || ""
      },
      items: orderItems.map(item => ({
        id: item.id.toString(),
        name: item.name || "",
        sku: item.sku || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        total: Number(item.total) || 0,
        type: item.type || "simple",
        bundleItems: item.bundle_item_id ? [{
          id: item.bundle_item_id.toString(),
          name: item.bundle_item_name || "",
          price: Number(item.bundle_item_price) || 0,
          quantity: Number(item.bundle_item_quantity) || 0,
          total: Number(item.bundle_item_total) || 0,
          selectedOptions: item.selected_options ? JSON.parse(item.selected_options) : {}
        }] : []
      })),
      refunds: refunds.map(refund => ({
        id: refund.id.toString(),
        date: refund.date_created_gmt?.toISOString() || new Date().toISOString(),
        amount: Number(refund.amount) || 0,
        reason: refund.reason || "",
        payment_method: refund.payment_method || "original",
        transaction_id: refund.transaction_id || "",
        created_by: refund.created_by || "System",
        refund_type: refund.refund_type || "partial",
        items: refund.items ? JSON.parse(refund.items) : []
      })),
      compatibility_warnings: order.compatibility_warnings ? JSON.parse(order.compatibility_warnings) : []
    };
    console.log(formattedOrder);
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
} 