import { prisma } from "./index";
import { Prisma } from "@prisma/client";

export interface Order {
  id: string;
  number: string;
  date: string;
  customer: string;
  status: string;
  total: number;
  refunds?: Refund[];
}

export interface Refund {
  id: string;
  date: string;
  amount: number;
  reason: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_by: string;
  restock_items: boolean;
  items: any[];
  order_id: string;
}

export async function getOrders() {
  const orders = await prisma.$queryRaw`
    SELECT o.*, oa.first_name, oa.last_name
    FROM wp_wc_orders o
    LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
    ORDER BY o.date_created_gmt DESC
  `;

  return (orders as any[]).map((order) => ({
    id: order.id.toString(),
    number: `#ORD-${order.id.toString().padStart(3, "0")}`,
    date: order.date_created_gmt?.toISOString() || new Date().toISOString(),
    customer: order.first_name || order.last_name
      ? `${order.first_name || ""} ${order.last_name || ""}`
      : "Unknown Customer",
    status: order.status || "pending",
    total: Number(order.total_amount) || 0,
  }));
}

export async function createOrder(orderData: any) {
  try {
    // Create transaction to ensure all related data is saved together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order record
      const order = await tx.wp_wc_orders.create({
        data: {
          id: BigInt(Math.floor(Math.random() * 10000) + 1),
          status: orderData.status || 'processing',
          currency: orderData.currency || 'USD',
          total_amount: orderData.total ? new Prisma.Decimal(orderData.total.toString()) : null,
          customer_id: orderData.customer_id ? BigInt(orderData.customer_id) : null,
          billing_email: orderData.billing_email || orderData.customer?.email || null,
          payment_method: orderData.payment_method || orderData.payment?.method || null,
          payment_method_title: orderData.payment_method_title || orderData.payment?.method || null,
          transaction_id: orderData.transaction_id || orderData.payment?.transaction || null,
          date_created_gmt: new Date(),
          date_updated_gmt: new Date(),
          customer_note: orderData.customer_note || null,
          ip_address: orderData.ip_address || null,
          user_agent: orderData.user_agent || null
        }
      });

      // 2. Create billing address if available
      if (orderData.billing) {
        await tx.wp_wc_order_addresses.create({
          data: {
            order_id: order.id,
            address_type: 'billing',
            first_name: orderData.customer?.name?.split(' ')[0] || '',
            last_name: orderData.customer?.name?.split(' ').slice(1).join(' ') || '',
            address_1: orderData.billing.address || '',
            city: orderData.billing.city || '',
            state: orderData.billing.state || '',
            postcode: orderData.billing.postcode || '',
            country: orderData.billing.country || '',
            email: orderData.customer?.email || '',
            phone: orderData.customer?.phone || ''
          }
        });
      }

      // 3. Create shipping address if available
      if (orderData.shipping) {
        await tx.wp_wc_order_addresses.create({
          data: {
            order_id: order.id,
            address_type: 'shipping',
            first_name: orderData.customer?.name?.split(' ')[0] || '',
            last_name: orderData.customer?.name?.split(' ').slice(1).join(' ') || '',
            address_1: orderData.shipping.address || '',
            city: orderData.shipping.city || '',
            state: orderData.shipping.state || '',
            postcode: orderData.shipping.postcode || '',
            country: orderData.shipping.country || ''
          }
        });
      }

      // 4. Create order items
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          // Use woocommerce_order_items table instead of wp_wc_order_items
          const orderItem = await tx.wp_woocommerce_order_items.create({
            data: {
              order_id: order.id,
              order_item_name: item.name || '',
              order_item_type: item.type || 'line_item'
            }
          });
          
          // Add item meta
          await tx.wp_woocommerce_order_itemmeta.createMany({
            data: [
              {
                order_item_id: orderItem.order_item_id,
                meta_key: '_product_id',
                meta_value: (item.product_id || 0).toString()
              },
              {
                order_item_id: orderItem.order_item_id,
                meta_key: '_variation_id',
                meta_value: (item.variation_id || 0).toString()
              },
              {
                order_item_id: orderItem.order_item_id,
                meta_key: '_qty',
                meta_value: (item.quantity || 0).toString()
              },
              {
                order_item_id: orderItem.order_item_id,
                meta_key: '_line_total',
                meta_value: (item.total || 0).toString()
              },
              {
                order_item_id: orderItem.order_item_id,
                meta_key: '_line_subtotal',
                meta_value: (item.price * item.quantity || 0).toString()
              }
            ]
          });

          // Add to order product lookup table
          await tx.wp_wc_order_product_lookup.create({
            data: {
              order_item_id: orderItem.order_item_id,
              order_id: order.id,
              product_id: BigInt(item.product_id || 0),
              variation_id: BigInt(item.variation_id || 0),
              customer_id: orderData.customer_id ? BigInt(orderData.customer_id) : null,
              date_created: new Date(),
              product_qty: item.quantity || 0,
              product_net_revenue: item.price || 0,
              product_gross_revenue: item.total || 0,
              coupon_amount: item.coupon_amount || 0,
              tax_amount: item.tax_amount || 0,
              shipping_amount: item.shipping_amount || 0,
              shipping_tax_amount: item.shipping_tax_amount || 0
            }
          });

          // If this is a bundle item with children, save those too
          if (item.type === 'bundle' && item.bundleItems && Array.isArray(item.bundleItems)) {
            for (const bundleItem of item.bundleItems) {
              // Skip bundle items with zero quantity
              if (bundleItem.quantity <= 0) continue;
              
              const bundleOrderItem = await tx.wp_woocommerce_order_items.create({
                data: {
                  order_id: order.id,
                  order_item_name: bundleItem.name || '',
                  order_item_type: 'bundle_item'
                }
              });
              
              // Add bundle item meta
              await tx.wp_woocommerce_order_itemmeta.createMany({
                data: [
                  {
                    order_item_id: bundleOrderItem.order_item_id,
                    meta_key: '_bundled_item_id',
                    meta_value: (bundleItem.id || 0).toString()
                  },
                  {
                    order_item_id: bundleOrderItem.order_item_id,
                    meta_key: '_bundled_by',
                    meta_value: orderItem.order_item_id.toString()
                  },
                  {
                    order_item_id: bundleOrderItem.order_item_id,
                    meta_key: '_product_id',
                    meta_value: (bundleItem.product_id || 0).toString()
                  },
                  {
                    order_item_id: bundleOrderItem.order_item_id,
                    meta_key: '_qty',
                    meta_value: (bundleItem.quantity || 0).toString()
                  },
                  {
                    order_item_id: bundleOrderItem.order_item_id,
                    meta_key: '_line_total',
                    meta_value: (bundleItem.total || 0).toString()
                  }
                ]
              });
              
              // Save to the wp_wc_order_bundle_lookup table
              try {
                // First, ensure the table exists
                await tx.$executeRaw`
                  CREATE TABLE IF NOT EXISTS wp_wc_order_bundle_lookup (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    order_id BIGINT UNSIGNED NOT NULL,
                    order_item_id BIGINT UNSIGNED NOT NULL,
                    bundle_id BIGINT UNSIGNED NOT NULL,
                    bundled_order_item_id BIGINT UNSIGNED NOT NULL,
                    product_id BIGINT UNSIGNED NOT NULL,
                    variation_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
                    quantity INT NOT NULL DEFAULT 0,
                    date_created DATETIME NOT NULL,
                    PRIMARY KEY (id),
                    KEY order_id (order_id),
                    KEY order_item_id (order_item_id),
                    KEY bundle_id (bundle_id),
                    KEY product_id (product_id)
                  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                `;
                
                // Now insert the data using a direct SQL query with proper escaping
                const productId = BigInt(bundleItem.product_id || 0);
                const variationId = BigInt(bundleItem.variation_id || 0);
                const quantity = bundleItem.quantity || 0;
                const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
                
                await tx.$executeRaw`
                  INSERT INTO wp_wc_order_bundle_lookup (
                    order_id, 
                    order_item_id, 
                    bundle_id, 
                    bundled_order_item_id, 
                    product_id, 
                    variation_id, 
                    quantity, 
                    date_created
                  ) VALUES (
                    ${order.id}, 
                    ${orderItem.order_item_id}, 
                    ${BigInt(item.id || 0)}, 
                    ${bundleOrderItem.order_item_id}, 
                    ${productId}, 
                    ${variationId}, 
                    ${quantity}, 
                    ${now}
                  )
                `;
                
                console.log('Successfully inserted bundle lookup data for order:', order.id);
              } catch (error) {
                console.error('Error inserting bundle lookup data:', error);
                // Continue with other operations even if this fails
              }
            }
          }
        }
      }

      // Return order with formatted data
      return {
        id: order.id.toString(),
        number: `#ORD-${order.id.toString().padStart(3, "0")}`,
        date: order.date_created_gmt?.toISOString() || new Date().toISOString(),
        status: order.status || 'processing',
        total: order.total_amount ? Number(order.total_amount) : 0,
        ...orderData,
      };
    });

    return result;
  } catch (error) {
    console.error('Error creating order in database:', error);
    throw error;
  }
} 