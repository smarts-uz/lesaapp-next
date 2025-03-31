import { prisma } from "./index"
import type { wp_posts, wp_postmeta } from "@prisma/client"

interface ProductMeta {
  _price?: string
  _regular_price?: string
  _sku?: string
  _stock?: string
  _stock_status?: string
  _manage_stock?: string
  _virtual?: string
  _downloadable?: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  regularPrice?: string
  sku?: string
  stock?: string
  stockStatus?: string
  manageStock: boolean
  isVirtual: boolean
  isDownloadable: boolean
  categories: string[]
  onSale: boolean
  type?: "bundle" | "simple"
  bundleItems?: Array<{
    id: number
    name: string
    price: number
    selectedOptions?: Record<string, string>
  }>
}

interface RawProduct extends wp_posts {
  meta_id: bigint
  post_id: bigint
  meta_key: string | null
  meta_value: string | null
}

export async function getProducts(): Promise<Product[]> {
  const products = await prisma.$queryRaw<RawProduct[]>`
    SELECT p.*, pm.meta_id, pm.post_id, pm.meta_key, pm.meta_value
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
    WHERE p.post_type = 'product'
    AND p.post_status = 'publish'
    AND EXISTS (
      SELECT 1 FROM wp_term_relationships tr
      JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      JOIN wp_terms t ON tt.term_id = t.term_id
      WHERE tr.object_id = p.ID
      AND t.slug = 'pos'
    )
    AND (pm.meta_key IN ('_price', '_regular_price', '_sku', '_stock', '_stock_status', '_manage_stock', '_virtual', '_downloadable') OR pm.meta_key IS NULL)
  `

  const groupedProducts = products.reduce((acc, curr) => {
    const productId = curr.ID.toString()
    if (!acc[productId]) {
      acc[productId] = {
        ...curr,
        postmeta: [],
      }
    }
    if (curr.meta_key) {
      acc[productId].postmeta.push({
        meta_id: curr.meta_id,
        post_id: curr.post_id,
        meta_key: curr.meta_key,
        meta_value: curr.meta_value,
      })
    }
    return acc
  }, {} as Record<string, wp_posts & { postmeta: wp_postmeta[] }>)

  return Object.values(groupedProducts).map((product) => {
    const meta = product.postmeta.reduce((acc: ProductMeta, curr) => {
      if (curr.meta_key) {
        acc[curr.meta_key as keyof ProductMeta] = curr.meta_value || undefined
      }
      return acc
    }, {})

    const categories = product.post_title.toLowerCase().includes("scaffold") 
      ? ["Scaffolding"] 
      : ["Safety"]

    return {
      id: Number(product.ID),
      name: product.post_title,
      description: product.post_content,
      price: Number(meta._price || 0),
      regularPrice: meta._regular_price,
      sku: meta._sku,
      stock: meta._stock,
      stockStatus: meta._stock_status,
      manageStock: meta._manage_stock === "yes",
      isVirtual: meta._virtual === "yes",
      isDownloadable: meta._downloadable === "yes",
      categories,
      onSale: false,
      type: "simple"
    }
  })
}
