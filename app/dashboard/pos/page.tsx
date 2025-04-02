import { prisma } from "@/lib/prisma"
import {POSClient} from "@/components/pos/pos-client"

export default async function POSPage() {
  const products = await prisma.$queryRaw<Array<{
    ID: bigint
    post_title: string
    post_content: string
    meta_key: string | null
    meta_value: string | null
    is_bundle: number | null
  }>>`
    SELECT p.ID, p.post_title, p.post_content, pm.meta_key, pm.meta_value,
           COUNT(wbi.bundle_id) as is_bundle
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key IN (
      '_price', '_regular_price', '_sku', '_stock', '_stock_status', 
      '_manage_stock', '_virtual', '_downloadable'
    )
    LEFT JOIN wp_woocommerce_bundled_items wbi ON p.ID = wbi.bundle_id
    WHERE p.post_type = 'product'
    AND p.post_status = 'publish'
    GROUP BY p.ID, p.post_title, p.post_content, pm.meta_key, pm.meta_value
  `

  const groupedProducts = products.reduce((acc, curr) => {
    const id = curr.ID.toString()
    if (!acc[id]) {
      acc[id] = {
        ID: curr.ID,
        post_title: curr.post_title,
        post_content: curr.post_content,
        meta: {},
        is_bundle: curr.is_bundle ? curr.is_bundle > 0 : false
      }
    }
    if (curr.meta_key) {
      acc[id].meta[curr.meta_key] = curr.meta_value || undefined
    }
    return acc
  }, {} as Record<string, {
    ID: bigint
    post_title: string
    post_content: string
    meta: Record<string, string | undefined>
    is_bundle: boolean
  }>)

  const bundleIds = Object.values(groupedProducts)
    .filter(product => product.is_bundle)
    .map(product => product.ID)

  let bundledItemsData: Record<string, Array<{
    bundled_item_id: bigint
    product_id: bigint
    bundle_id: bigint
    child_post_title: string
    child_price: string | null
    min_quantity: string | null
    max_quantity: string | null
    optional: string | null
  }>> = {}

  if (bundleIds.length > 0) {
    const bundledItems = await prisma.$queryRaw<Array<{
      bundled_item_id: bigint
      product_id: bigint
      bundle_id: bigint
      child_post_title: string
      child_price: string | null
      min_quantity: string | null
      max_quantity: string | null
      optional: string | null
    }>>`
      SELECT 
        wbi.bundled_item_id,
        wbi.product_id,
        wbi.bundle_id,
        child.post_title as child_post_title,
        child_price.meta_value as child_price,
        (SELECT meta_value FROM wp_woocommerce_bundled_itemmeta WHERE bundled_item_id = wbi.bundled_item_id AND meta_key = 'min_quantity') as min_quantity,
        (SELECT meta_value FROM wp_woocommerce_bundled_itemmeta WHERE bundled_item_id = wbi.bundled_item_id AND meta_key = 'max_quantity') as max_quantity,
        (SELECT meta_value FROM wp_woocommerce_bundled_itemmeta WHERE bundled_item_id = wbi.bundled_item_id AND meta_key = 'optional') as optional
      FROM wp_woocommerce_bundled_items wbi
      JOIN wp_posts child ON wbi.product_id = child.ID
      LEFT JOIN wp_postmeta child_price ON child.ID = child_price.post_id AND child_price.meta_key = '_price'
      WHERE wbi.bundle_id IN (${bundleIds.join(',')})
    `

    bundledItems.forEach(item => {
      const bundleId = item.bundle_id.toString()
      if (!bundledItemsData[bundleId]) {
        bundledItemsData[bundleId] = []
      }
      bundledItemsData[bundleId].push(item)
    })
  }

  const constructionProducts = Object.values(groupedProducts)
    .map((product) => {
      const isBundle = product.is_bundle
      const productId = product.ID.toString()
      const bundledItems = isBundle && bundledItemsData[productId] 
        ? bundledItemsData[productId].map((item, index) => ({
            id: Number(item.bundled_item_id),
            productId: Number(item.product_id),
            name: item.child_post_title,
            price: Number(item.child_price || 0),
            defaultQuantity: 1,
            minQuantity: Number(item.min_quantity || 1),
            maxQuantity: Number(item.max_quantity || 10),
            optional: item.optional === 'yes'
          }))
        : undefined

      return {
        id: Number(product.ID),
        name: product.post_title,
        description: product.post_content,
        price: Number(product.meta._price || 0),
        stock: Number(product.meta._stock || 0),
        sku: product.meta._sku,
        virtual: product.meta._virtual === "yes",
        downloadable: product.meta._downloadable === "yes",
        categories: product.post_title.toLowerCase().includes("scaffold") ? ["Scaffolding"] : ["Safety"],
        onSale: false,
        type: isBundle ? "bundle" as const : "simple" as const,
        bundledItems
      }
    })
    console.log(constructionProducts)
  return <POSClient products={constructionProducts} />
}

