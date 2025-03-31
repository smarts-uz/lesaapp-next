export interface Product {
  id: number
  name: string
  price: number
  image?: string
  categories: string[]
  stock: number
  onSale: boolean
  type?: "simple" | "bundle"
  bundledItems?: BundledItem[]
  variations?: ProductVariation[]
}

export interface ProductVariation {
  id: number
  name: string
  options: string[]
}

export interface BundledItem {
  id: number
  productId: number
  name: string
  price: number
  image?: string
  defaultQuantity: number
  minQuantity: number
  maxQuantity: number
  optional: boolean
  variations?: ProductVariation[]
  selectedOptions?: Record<string, string>
}

export interface CartItem extends Product {
  quantity: number
  bundleItems?: CustomizedBundleItem[]
}

export interface CustomizedBundleItem extends BundledItem {
  quantity: number
  selectedOptions?: Record<string, string>
  quantity: number
}

export interface Order {
  id: string
  number: string
  date: string
  status: string
  customer: {
    name: string
    email: string
    phone: string
  }
  billing: {
    address: string
    city: string
    state: string
    postcode: string
    country: string
  }
  shipping: {
    address: string
    city: string
    state: string
    postcode: string
    country: string
  }
  payment: {
    method: string
    transaction: string
  }
  items: OrderItem[]
  subtotal: number
  shipping_total: number
  tax_total: number
  discount_total: number
  total: number
  refunds?: Refund[]
  compatibility_warnings?: string[]
}

export interface OrderItem {
  id: number
  name: string
  sku: string
  price: number
  quantity: number
  total: number
  refundable: boolean
  type?: "simple" | "bundle"
  bundleItems?: OrderBundleItem[]
}

export interface OrderBundleItem {
  id: number
  name: string
  sku: string
  price: number
  quantity: number
  total: number
  selectedOptions?: Record<string, string>
}

export interface Refund {
  id: string
  order_id: string
  date: string
  amount: number
  reason: string
  items: RefundItem[]
  payment_method: string
  transaction_id: string
  status: string
  created_by: string
  restock_items: boolean
  refund_type?: "partial" | "full"
}

export interface RefundItem {
  id: number
  name: string
  type?: string
  bundleItemIds?: number[]
  refunded: boolean
}

export interface RefundData {
  order_id: string
  order_number: string
  amount: number
  date: string
  reason: string
  items: RefundItem[]
  restock: boolean
  payment_method: string
  refund_type: "partial" | "full"
}

export interface Booking {
  id: string
  date: string
  time: string
  customer: string
  service: string
  status: string
  price: number
  bundleItems?: BookingBundleItem[]
}

export interface BookingBundleItem {
  id: number
  name: string
  quantity: number
  selectedOptions?: Record<string, string>
}

export interface Discount {
  id: number
  name: string
  type: string
  startDate: string
  endDate: string
  value: number
  products: string[]
}

