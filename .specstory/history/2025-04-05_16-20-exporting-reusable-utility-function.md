<!-- Generated by SpecStory -->

# Exporting Reusable Utility Function (2025-04-05 21:20:40)

_**User**_

@services export the get function as a reusable utility function inside order/fetch

---

_**Assistant**_



---

<details>
            <summary>Listed directory services/order • **2** results</summary>
        
| Name |
|-------|
| 📁 `fetch` |
| 📁 `create` |

</details>

---

<details>
            <summary>Listed directory services/order/fetch • **0** results</summary>
        
No results found
</details>

---

<details>
            <summary>Searched codebase "interface Order prisma order" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `app/api/order/route.ts` | L62-89 |
| `app/api/order/route.ts` | L23-39 |
| `app/api/order/route.ts` | L1-20 |
| `app/api/order/route.ts` | L89-108 |
| `app/api/order/route.ts` | L507-529 |
| `app/api/order/route.ts` | L285-324 |
| `app/api/order/route.ts` | L229-285 |
| `app/api/order/route.ts` | L49-62 |
| `app/api/order/route.ts` | L39-49 |
| `app/api/order/route.ts` | L108-148 |
| `app/api/order/route.ts` | L444-507 |
| `app/api/order/route.ts` | L352-401 |
| `app/api/order/route.ts` | L197-229 |
| `app/api/order/route.ts` | L324-352 |
| `app/api/order/route.ts` | L148-197 |
| `app/api/customer/route.ts` | L1-37 |
| `app/api/order/route.ts` | L401-444 |
| `app/api/refund/route.ts` | L83-146 |
| `app/dashboard/orders/page.tsx` | L375-404 |
| `app/api/refund/route.ts` | L1-13 |
| `app/api/refund/route.ts` | L146-191 |
| `app/dashboard/orders/page.tsx` | L439-474 |
| `app/dashboard/orders/page.tsx` | L1-34 |
| `app/dashboard/orders/page.tsx` | L404-439 |
| `app/dashboard/orders/page.tsx` | L254-294 |

</details>

---

```diff
- 
+ import { prisma } from "@/lib/prisma";
+ 
+ // Custom BigInt serializer
+ const bigIntSerializer = () => {
+   const originalStringify = JSON.stringify;
+   JSON.stringify = function (obj: any) {
+     return originalStringify(obj, (_, value) =>
+       typeof value === "bigint" ? value.toString() : value
+     );
+   };
+ };
+ 
+ // Initialize BigInt serializer
+ bigIntSerializer();
+ 
+ interface Order {
+   id: bigint;
+   date_created_gmt: Date;
+   status: string;
+   total_amount: number;
+   payment_method: string | null;
+   payment_method_title: string | null;
+   first_name: string | null;
+   last_name: string | null;
+   email: string | null;
+   phone: string | null;
+   address_1: string | null;
+   city: string | null;
+   country: string | null;
+ }
+ 
+ interface OrderItem {
+   order_item_id: number;
+   order_item_name: string;
+   product_id: string;
+   variation_id: string;
+   quantity: string;
+   subtotal: string;
+   total: string;
+ }
+ 
+ export interface FormattedOrder {
+   id: string;
+   number: string;
+   date: string;
+   status: string;
+   total: number;
+   customer: {
+     name: string;
+     email: string | null;
+     phone: string | null;
+     address: string | null;
+     city: string | null;
+     country: string | null;
+   };
+   payment: {
+     method: string | null;
+     methodTitle: string | null;
+   };
+   items: {
+     id: number;
+     name: string;
+     product_id: string;
+     variation_id: string;
+     quantity: number;
+     subtotal: number;
+     total: number;
+   }[];
+ }
+ 
+ export async function fetchOrders(): Promise<FormattedOrder[]> {
+   try {
+     // Get orders with customer details
+     const orders = await prisma.$queryRaw<Order[]>`
+       SELECT 
+         o.id, 
+         o.date_created_gmt, 
+         o.status, 
+         o.total_amount,
+         o.payment_method,
+         o.payment_method_title,
+         oa.first_name, 
+         oa.last_name,
+         oa.email,
+         oa.phone,
+         oa.address_1,
+         oa.city,
+         oa.country
+       FROM wp_wc_orders o
+       LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
+       ORDER BY o.date_created_gmt DESC
+     `;
+ 
+     const formattedOrders = await Promise.all(
+       orders.map(async (order: Order) => {
+         // Get order items for each order
+         const orderItems = await prisma.$queryRaw<OrderItem[]>`
+         SELECT 
+           oi.order_item_id,
+           oi.order_item_name,
+           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_product_id') as product_id,
+           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_variation_id') as variation_id,
+           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_qty') as quantity,
+           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_line_subtotal') as subtotal,
+           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_line_total') as total
+         FROM wp_woocommerce_order_items oi
+         WHERE oi.order_id = ${order.id}
+         AND oi.order_item_type = 'line_item'
+       `;
+ 
+         const formattedItems = orderItems.map((item: OrderItem) => ({
+           id: item.order_item_id,
+           name: item.order_item_name,
+           product_id: item.product_id,
+           variation_id: item.variation_id,
+           quantity: parseInt(item.quantity || "0"),
+           subtotal: parseFloat(item.subtotal || "0"),
+           total: parseFloat(item.total || "0"),
+         }));
+ 
+         return {
+           id: order.id.toString(),
+           number: `#ORD-${order.id.toString().padStart(3, "0")}`,
+           date:
+             order.date_created_gmt?.toISOString() || new Date().toISOString(),
+           status: order.status || "pending",
+           total: Number(order.total_amount) || 0,
+           customer: {
+             name:
+               order.first_name || order.last_name
+                 ? `${order.first_name || ""} ${order.last_name || ""}`
+                 : "Unknown Customer",
+             email: order.email || null,
+             phone: order.phone || null,
+             address: order.address_1 || null,
+             city: order.city || null,
+             country: order.country || null,
+           },
+           payment: {
+             method: order.payment_method || null,
+             methodTitle: order.payment_method_title || null,
+           },
+           items: formattedItems,
+         };
+       })
+     );
+ 
+     return formattedOrders;
+   } catch (error) {
+     console.error("Failed to fetch orders:", error);
+     throw new Error("Failed to fetch orders");
+   }
+ } 
```

---

```diff
  import { createBundleItem } from "@/services/order/create/createBundleItem";
  import { updateProductStock } from "@/services/order/create/updateProductStock";
+ import { fetchOrders } from "@/services/order/fetch/fetchOrders";
  
  // Custom BigInt serializer
  export async function GET() {
    try {
-     // Get orders with customer details
-     const orders = await prisma.$queryRaw<Order[]>`
-       SELECT 
-         o.id, 
-         o.date_created_gmt, 
-         o.status, 
-         o.total_amount,
-         o.payment_method,
-         o.payment_method_title,
-         oa.first_name, 
-         oa.last_name,
-         oa.email,
-         oa.phone,
-         oa.address_1,
-         oa.city,
-         oa.country
-       FROM wp_wc_orders o
-       LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
-       ORDER BY o.date_created_gmt DESC
-     `;
- 
-     const formattedOrders = await Promise.all(
-       orders.map(async (order: Order) => {
-         // Get order items for each order
-         const orderItems = await prisma.$queryRaw<OrderItem[]>`
-         SELECT 
-           oi.order_item_id,
-           oi.order_item_name,
-           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_product_id') as product_id,
-           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_variation_id') as variation_id,
-           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_qty') as quantity,
-           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_line_subtotal') as subtotal,
-           (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_line_total') as total
-         FROM wp_woocommerce_order_items oi
-         WHERE oi.order_id = ${order.id}
-         AND oi.order_item_type = 'line_item'
-       `;
- 
-         const formattedItems = orderItems.map((item: OrderItem) => ({
-           id: item.order_item_id,
-           name: item.order_item_name,
-           product_id: item.product_id,
-           variation_id: item.variation_id,
-           quantity: parseInt(item.quantity || "0"),
-           subtotal: parseFloat(item.subtotal || "0"),
-           total: parseFloat(item.total || "0"),
-         }));
- 
-         return {
-           id: order.id.toString(),
-           number: `#ORD-${order.id.toString().padStart(3, "0")}`,
-           date:
-             order.date_created_gmt?.toISOString() || new Date().toISOString(),
-           status: order.status || "pending",
-           total: Number(order.total_amount) || 0,
-           customer: {
-             name:
-               order.first_name || order.last_name
-                 ? `${order.first_name || ""} ${order.last_name || ""}`
-                 : "Unknown Customer",
-             email: order.email || null,
-             phone: order.phone || null,
-             address: order.address_1 || null,
-             city: order.city || null,
-             country: order.country || null,
-           },
-           payment: {
-             method: order.payment_method || null,
-             methodTitle: order.payment_method_title || null,
-           },
-           items: formattedItems,
-         };
-       })
-     );
+     const formattedOrders = await fetchOrders();
      
      return new NextResponse(JSON.stringify(formattedOrders), {
```

---

```diff
- 
+ export { fetchOrders } from './fetchOrders';
+ export type { FormattedOrder } from './fetchOrders'; 
```

---

I've successfully extracted the order fetching functionality into a reusable utility function:

1. Created `fetchOrders.ts` in the `services/order/fetch` directory that:
   - Contains all the necessary interfaces
   - Implements the BigInt serialization logic
   - Exports a properly typed `fetchOrders` function that returns `FormattedOrder[]`

2. Updated `app/api/order/route.ts` to:
   - Import the new `fetchOrders` function
   - Simplify the GET handler to use this function

3. Created an `index.ts` file in the `services/order/fetch` directory to:
   - Export the `fetchOrders` function
   - Export the `FormattedOrder` type for use elsewhere in the application

The utility function maintains the same behavior as before but is now reusable across the application. This improves code organization and follows the project's modular structure.

---

_**User**_


@refund  create an index file for create dir

---

_**Assistant**_



---

<details>
            <summary>Listed directory services/refund • **2** results</summary>
        
| Name |
|-------|
| 📁 `create` |
| 📁 `fetch` |

</details>

---

<details>
            <summary>Listed directory services/refund/create • **0** results</summary>
        
No results found
</details>

---

<details>
            <summary>Searched codebase "refund create services" • **0** results</summary>
        
No results found
</details>

---

<details>
            <summary>Searched codebase "refund create services" • **22** results</summary>
        
| File | Lines |
|------|-------|
| `app/api/refund/route.ts` | L191-249 |
| `app/api/refund/route.ts` | L314-370 |
| `app/api/refund/route.ts` | L1-13 |
| `app/api/refund/route.ts` | L290-314 |
| `app/api/refund/route.ts` | L670-696 |
| `app/api/refund/route.ts` | L31-83 |
| `app/api/refund/route.ts` | L798-825 |
| `app/api/refund/route.ts` | L418-451 |
| `app/api/refund/route.ts` | L83-146 |
| `app/api/refund/route.ts` | L13-26 |
| `app/api/refund/route.ts` | L696-740 |
| `app/api/refund/route.ts` | L451-500 |
| `app/api/refund/route.ts` | L370-418 |
| `app/api/refund/route.ts` | L146-191 |
| `app/api/refund/route.ts` | L249-290 |
| `app/api/refund/route.ts` | L740-798 |
| `app/api/refund/route.ts` | L500-545 |
| `app/api/refund/example.sql` | L1-358 |
| `app/api/refund/route.ts` | L620-670 |
| `app/api/refund/route.ts` | L545-570 |
| `app/api/refund/route.ts` | L26-31 |
| `app/api/refund/route.ts` | L570-620 |

</details>

---

<details>
            <summary>Listed directory app/api/refund • **2** results</summary>
        
| Name |
|-------|
| 📄 `route.ts` |
| 📄 `example.sql` |

</details>

---

Read file: app/api/refund/route.ts

---

<details>
            <summary>Listed directory services/refund/create • **0** results</summary>
        
No results found
</details>

---

```diff
- 
+ // Export refund creation services
+ // This file will export functions for creating refunds once they're implemented
+ 
+ export interface RefundRequest {
+   orderId: number;
+   items: RefundItem[];
+   reason?: string;
+   refundPayment?: boolean;
+   refundType?: "partial" | "full";
+   discountDays: number;
+   endDate: string;
+ }
+ 
+ export interface RefundItem {
+   itemId: number;
+   productId: number;
+   quantity: number;
+   amount: number;
+   isBundle?: boolean;
+   bundledItems?: Array<{
+     itemId: number;
+     productId: number;
+     quantity: number;
+   }>;
+ }
+ 
+ export interface StockAdjustment {
+   productId: number;
+   quantity: number;
+ }
+ 
+ // When refund creation functions are implemented, they will be exported here 
```

---

I've created an index file for the `services/refund/create` directory. The file exports the interfaces that represent the data structures used for refund creation, which I extracted from the `app/api/refund/route.ts` file.

The index file includes:

1. `RefundRequest` interface - represents the main refund request data structure
2. `RefundItem` interface - represents individual items to be refunded
3. `StockAdjustment` interface - represents product stock changes during refund

This follows the same pattern as the `services/order/fetch/index.ts` file you created earlier. The file is prepared for future refund creation functions that would be exported from this directory.

---

_**User**_

no create it for order/create

---

_**Assistant**_



---

<details>
            <summary>Listed directory services/order/create • **8** results</summary>
        
| Name |
|-------|
| 📄 `createBillingAddress.ts` |
| 📄 `updateProductStock.ts` |
| 📄 `createBundleItem.ts` |
| 📄 `createBundleProductMeta.ts` |
| 📄 `createOrderItemMeta.ts` |
| 📄 `createOrderItem.ts` |
| 📄 `createOperationalData.ts` |
| 📄 `createOrderRecord.ts` |

</details>

---

Read file: services/order/create/createOrderRecord.ts

---

Read file: services/order/create/createOrderItem.ts

---

Read file: services/order/create/updateProductStock.ts

---

```diff
- 
+ // Export order creation services
+ export { createOrderRecord } from './createOrderRecord';
+ export { createBillingAddress } from './createBillingAddress';
+ export { createOperationalData } from './createOperationalData';
+ export { createOrderItem } from './createOrderItem';
+ export { generateOrderItemMeta } from './createOrderItemMeta';
+ export { generateBundleProductMeta } from './createBundleProductMeta';
+ export { createBundleItem } from './createBundleItem';
+ export { updateProductStock } from './updateProductStock';
+ 
+ // Define common interfaces
+ export interface ProductItem {
+   product_id: number;
+   quantity: number;
+   price: number;
+   name?: string;
+   variationId?: number;
+   isBundle?: boolean;
+   bundleItems?: Array<{
+     product_id: number;
+     quantity: number;
+   }>;
+ }
+ 
+ export interface Customer {
+   id?: number;
+   firstName?: string;
+   lastName?: string;
+   email?: string;
+   phone?: string;
+   address?: string;
+   city?: string;
+   country?: string;
+ }
+ 
+ export interface OrderCreateParams {
+   customer?: Customer;
+   products: ProductItem[];
+   status?: string;
+   paymentMethod?: string;
+   paymentMethodTitle?: string;
+   start_date: string;
+ } 
```

---

```diff
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/prisma";
- import { createOrderRecord } from "@/services/order/create/createOrderRecord";
- import { createBillingAddress } from "@/services/order/create/createBillingAddress";
- import { createOperationalData } from "@/services/order/create/createOperationalData";
- import { createOrderItem } from "@/services/order/create/createOrderItem";
- import { generateOrderItemMeta } from "@/services/order/create/createOrderItemMeta";
- import { generateBundleProductMeta } from "@/services/order/create/createBundleProductMeta";
+ import {
+   createOrderRecord,
+   createBillingAddress,
+   createOperationalData,
+   createOrderItem,
+   generateOrderItemMeta,
+   generateBundleProductMeta,
+   updateProductStock,
+   ProductItem,
+   OrderCreateParams,
+ } from "@/services/order/create";
  import { createBundleItem } from "@/services/order/create/createBundleItem";
- import { updateProductStock } from "@/services/order/create/updateProductStock";
  import { fetchOrders } from "@/services/order/fetch";
  
    total: string;
  }
- 
- interface ProductItem {
-   product_id: number;
-   quantity: number;
-   price: number;
-   name?: string;
-   variationId?: number;
-   isBundle?: boolean;
-   bundleItems?: Array<{
-     product_id: number;
-     quantity: number;
-   }>;
- }
  
  interface PrismaTransaction {
```

---

```diff
    generateOrderItemMeta,
    generateBundleProductMeta,
+   createBundleItem,
    updateProductStock,
    ProductItem,
  }
  
- // Add interface for POST request body
- interface OrderCreateBody {
-   customer?: {
-     id?: number;
-     firstName?: string;
-     lastName?: string;
-     email?: string;
-     phone?: string;
-     address?: string;
-     city?: string;
-     country?: string;
-   };
-   products: ProductItem[];
-   status?: string;
-   paymentMethod?: string;
-   paymentMethodTitle?: string;
-   start_date: string; // Add start_date field
- }
+ // Use the OrderCreateParams interface from services/order/create
+ type OrderCreateBody = OrderCreateParams;
  
  export async function GET() {
```

---

I've created an index file for the `services/order/create` directory that exports all the functions and interfaces needed for order creation. This follows the same pattern as what we did with the `fetch` directory earlier.

The index file:
1. Exports all the utility functions for creating orders
2. Defines and exports common interfaces like `ProductItem`, `Customer`, and `OrderCreateParams`

I also updated the `app/api/order/route.ts` file to:
1. Import all functions from the new index file instead of individual files
2. Remove the duplicated `ProductItem` interface definition
3. Replace the `OrderCreateBody` interface with a type alias to `OrderCreateParams` from the index file

This change improves code organization by:
1. Centralizing all exports from the `create` directory in one file
2. Ensuring consistent interface definitions across the codebase
3. Making imports cleaner in files that use these functions

---



---

