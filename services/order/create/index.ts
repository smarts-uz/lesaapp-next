// Export order creation services
export { createOrderRecord } from "./createOrderRecord";
export { createBillingAddress } from "./createBillingAddress";
export { createOperationalData } from "./createOperationalData";
export { createOrderItem } from "./createOrderItem";
export {
  generateOrderItemMeta,
  generateBundledItemMeta,
} from "./createOrderItemMeta";
export { generateBundleProductMeta } from "./createBundleProductMeta";
export { updateProductStock } from "./updateProductStock";
export { updateBundledItemStock } from "./updateProductStock";
export { createOrderProductLookup } from "./createOrderProductLookup";
export { createOrderStats } from "./createOrderStats";
export { createBundledItemMeta } from "./createBundledItemMeta";
export { createOrderItemMetaEntries } from "./createOrderItemMetaEntries";

// Define common interfaces
export interface ProductItem {
  product_id: number;
  quantity: number;
  price: number;
  name?: string;
  variationId?: number;
  isBundle?: boolean;
  bundleItems?: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export interface Customer {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface OrderCreateParams {
  customer?: Customer;
  products: ProductItem[];
  status?: string;
  paymentMethod?: string;
  paymentMethodTitle?: string;
  start_date: string;
}
