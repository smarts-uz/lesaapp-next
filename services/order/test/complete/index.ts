import { updateOrderStatus } from './updateOrderStatus';
import { processOrderItems } from './processOrderItems';
import { recordLostProduct } from './recordLostProduct';

export {
  updateOrderStatus,
  processOrderItems,
  recordLostProduct,
};

export interface OrderCompletionParams {
  orderId: bigint;
}

export interface OrderItemProcessResult {
  orderItemId: bigint;
  productId: bigint;
  refunded: boolean;
  error?: string;
}

export interface ProcessRefundParams {
  tx: any;
  orderItem: any;
}

export interface RecordLostProductParams {
  tx: any;
  item: any;
  error?: string;
}

export interface UpdateOrderStatusParams {
  tx: any;
  orderId: bigint;
} 