import { updateOrderStatus } from './updateOrderStatus';
import { processOrderItems, checkIfRefunded } from './processOrderItems';
import { recordLostProduct } from './recordLostProduct';

export {
  updateOrderStatus,
  processOrderItems,
  recordLostProduct,
  checkIfRefunded,
};

export interface OrderCompletionParams {
  orderId: bigint;
}

export interface OrderItemProcessResult {
  orderItemId: bigint;
  productId: bigint | null;
  name?: string;
  refunded: boolean;
  isBundle?: boolean;
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

export interface CheckRefundParams {
  tx: any;
  orderItemId: bigint;
}

export interface RefundCheckResult {
  isRefunded: boolean;
  refundedQty: number;
} 