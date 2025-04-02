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

interface BundleItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  variation_id?: number;
  tax_amount?: number;
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

      // After creating the order record and addresses, but before processing items
      // Create the initial order stats record
      try {
        await tx.$executeRaw`
          INSERT INTO wp_wc_order_stats (
            order_id,
            parent_id,
            date_created,
            date_created_gmt,
            num_items_sold,
            total_sales,
            tax_total,
            shipping_total,
            net_total,
            status,
            customer_id
          ) VALUES (
            ${order.id},
            ${order.parent_order_id || 0},
            ${new Date()},
            ${new Date()},
            0,
            ${orderData.total || 0},
            ${orderData.tax_total || 0},
            ${orderData.shipping_total || 0},
            ${(orderData.total || 0) - (orderData.tax_total || 0)},
            ${order.status || 'processing'},
            ${orderData.customer_id ? BigInt(orderData.customer_id) : 0}
          )
        `;
      } catch (error) {
        console.error('Error creating order stats record:', error);
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
              },
              {
                order_item_id: orderItem.order_item_id,
                meta_key: '_line_tax',
                meta_value: (item.tax_amount || 0).toString()
              },
              {
                order_item_id: orderItem.order_item_id,
                meta_key: '_line_tax_data',
                meta_value: JSON.stringify({total: {}, subtotal: {}})
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
          
          // Add to order stats (update quantities and totals)
          try {
            await tx.$executeRaw`
              UPDATE wp_wc_order_stats 
              SET num_items_sold = num_items_sold + ${item.quantity || 0},
                  total_sales = total_sales + ${item.total || 0},
                  net_total = net_total + ${(item.total || 0) - (item.tax_amount || 0)}
              WHERE order_id = ${order.id}
            `;
          } catch (error) {
            console.error('Error updating order stats:', error);
          }
          
          // Update product stock levels and sales count
          try {
            await tx.$executeRaw`
              UPDATE wp_wc_product_meta_lookup
              SET stock_quantity = stock_quantity - ${item.quantity || 0},
                  total_sales = total_sales + ${item.quantity || 0}
              WHERE product_id = ${BigInt(item.product_id || 0)}
            `;
          } catch (error) {
            console.error('Error updating product meta:', error);
          }

          // If this is a bundle item with children, save those too
          if (item.type === 'bundle' && item.bundleItems) {
            // Create all bundle items first
            const bundleOrderItems = await Promise.all(
              item.bundleItems.map(async (bundleItem: BundleItem) => {
                const bundleOrderItem = await tx.wp_woocommerce_order_items.create({
                  data: {
                    order_id: order.id,
                    order_item_name: bundleItem.name || '',
                    order_item_type: 'bundle_item'
                  }
                });

                // Add bundle item meta in a single operation
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
                    },
                    {
                      order_item_id: bundleOrderItem.order_item_id,
                      meta_key: '_bundled_item_priced_individually',
                      meta_value: 'yes'
                    }
                  ]
                });

                return { bundleOrderItem, bundleItem };
              })
            );

            // Update all bundle-related data in parallel
            await Promise.all([
              // Update order stats for the main bundle
              tx.$executeRaw`
                UPDATE wp_wc_order_stats 
                SET num_items_sold = num_items_sold + ${item.quantity || 0},
                    total_sales = total_sales + ${item.total || 0},
                    net_total = net_total + ${(item.total || 0) - (item.tax_amount || 0)}
                WHERE order_id = ${order.id}
              `,
              
              // Insert main bundle lookup data with better duplicate handling
              (async () => {
                try {
                  // First check if the record exists
                  const existingMain = await tx.$queryRaw`
                    SELECT COUNT(*) as count 
                    FROM wp_wc_order_bundle_lookup 
                    WHERE order_id = ${order.id} 
                    AND order_item_id = ${orderItem.order_item_id}
                    AND product_id = ${BigInt(item.product_id || 0)}
                    AND parent_order_item_id = ${BigInt(0)}
                  `;
                  
                  if ((existingMain as any[])[0]?.count === 0) {
                    await tx.$executeRaw`
                      INSERT INTO wp_wc_order_bundle_lookup (
                        order_id, order_item_id, parent_order_item_id, bundle_id,
                        product_id, variation_id, customer_id, date_created,
                        product_qty, product_net_revenue, product_gross_revenue,
                        coupon_amount, tax_amount
                      ) VALUES (
                        ${order.id}, ${orderItem.order_item_id}, ${BigInt(0)},
                        ${BigInt(item.id || 0)}, ${BigInt(item.product_id || 0)},
                        ${BigInt(0)}, ${orderData.customer_id ? BigInt(orderData.customer_id) : BigInt(0)},
                        ${new Date()}, ${item.quantity || 1}, ${item.price || 0},
                        ${item.total || 0}, ${item.coupon_amount || 0},
                        ${item.tax_amount || 0}
                      )
                    `;
                  }
                } catch (error) {
                  console.error('Error inserting main bundle lookup data:', error);
                }
              })(),

              // Insert bundle items lookup data with better duplicate handling
              ...bundleOrderItems.map(({ bundleOrderItem, bundleItem }) =>
                (async () => {
                  try {
                    // First check if the record exists
                    const existingItem = await tx.$queryRaw`
                      SELECT COUNT(*) as count 
                      FROM wp_wc_order_bundle_lookup 
                      WHERE order_id = ${order.id} 
                      AND order_item_id = ${orderItem.order_item_id}
                      AND product_id = ${BigInt(bundleItem.product_id || 0)}
                      AND parent_order_item_id = ${bundleOrderItem.order_item_id}
                    `;
                    
                    if ((existingItem as any[])[0]?.count === 0) {
                      await tx.$executeRaw`
                        INSERT INTO wp_wc_order_bundle_lookup (
                          order_id, order_item_id, parent_order_item_id, bundle_id,
                          product_id, variation_id, customer_id, date_created,
                          product_qty, product_net_revenue, product_gross_revenue,
                          coupon_amount, tax_amount
                        ) VALUES (
                          ${order.id}, ${orderItem.order_item_id},
                          ${bundleOrderItem.order_item_id}, ${BigInt(item.id || 0)},
                          ${BigInt(bundleItem.product_id || 0)},
                          ${BigInt(bundleItem.variation_id || 0)},
                          ${orderData.customer_id ? BigInt(orderData.customer_id) : BigInt(0)},
                          ${new Date()}, ${bundleItem.quantity || 0},
                          ${bundleItem.price || 0}, ${bundleItem.total || 0},
                          ${0}, ${0}
                        )
                      `;
                    }
                  } catch (error) {
                    console.error('Error inserting bundle item lookup data:', error);
                  }
                })()
              ),

              // Update product meta for all items
              ...bundleOrderItems.map(({ bundleItem }) =>
                tx.$executeRaw`
                  UPDATE wp_wc_product_meta_lookup
                  SET stock_quantity = stock_quantity - ${bundleItem.quantity || 0},
                      total_sales = total_sales + ${bundleItem.quantity || 0}
                  WHERE product_id = ${BigInt(bundleItem.product_id || 0)}
                `
              ),

              // Update order stats for all bundle items
              ...bundleOrderItems.map(({ bundleItem }) =>
                tx.$executeRaw`
                  UPDATE wp_wc_order_stats 
                  SET num_items_sold = num_items_sold + ${bundleItem.quantity || 0},
                      total_sales = total_sales + ${bundleItem.total || 0},
                      net_total = net_total + ${(bundleItem.total || 0) - (bundleItem.tax_amount || 0)}
                  WHERE order_id = ${order.id}
                `
              )
            ]);
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
    }, {
      timeout: 30000 // Increase timeout to 30 seconds
    });

    return result;
  } catch (error) {
    console.error('Error creating order in database:', error);
    throw error;
  }
} 