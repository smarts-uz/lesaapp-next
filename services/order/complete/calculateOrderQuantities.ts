import { OrderProduct, getOrderProducts } from './getOrdersWithProducts'

interface ProductQuantitySummary {
  totalQuantity: number
  productQuantities: {
    product_id: bigint
    quantity: number
  }[]
}

/**
 * Calculate total quantities for products in an order
 * @param orderId - The order ID to calculate quantities for
 * @returns Object containing total quantity and per-product quantities
 */
export async function calculateOrderQuantities(orderId: number): Promise<ProductQuantitySummary> {
  try {
    const products = await getOrderProducts(orderId)
    
    const productQuantities = products.map(product => ({
      product_id: product.product_id,
      quantity: product.product_qty
    }))

    const totalQuantity = products.reduce((sum, product) => sum + product.product_qty, 0)

    return {
      totalQuantity,
      productQuantities
    }
  } catch (error) {
    console.error('Error calculating order quantities:', error)
    throw error
  }
} 