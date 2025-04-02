// This file is kept for backward compatibility
// All functions have been moved to the lib/woocommerce directory

// Re-export all functions from the new location
export { fetchProducts } from './woocommerce/products';
export { createOrder, fetchOrder } from './woocommerce/orders';
export { processRefund } from './woocommerce/refunds';
export { 
  getOrderItems, 
  getOrderBundleItems, 
  getRefundableItems, 
  getRefundableBundleItems 
} from './woocommerce/utils';
