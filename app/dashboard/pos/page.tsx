import { prisma } from "@/lib/prisma"
import {POSClient} from "@/components/pos/pos-client"

export default async function POSPage() {
  // Fetch all products with complete metadata
  const products = await prisma.$queryRaw<Array<{
    ID: bigint
    post_title: string
    post_content: string
    post_excerpt: string
    post_name: string
    post_date: Date
    post_modified: Date
    meta_key: string | null
    meta_value: string | null
    is_bundle: number | null
  }>>`
    SELECT 
      p.ID, 
      p.post_title, 
      p.post_content,
      p.post_excerpt,
      p.post_name,
      p.post_date,
      p.post_modified,
      pm.meta_key, 
      pm.meta_value,
      COUNT(wbi.bundle_id) as is_bundle
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
    LEFT JOIN wp_woocommerce_bundled_items wbi ON p.ID = wbi.bundle_id
    WHERE p.post_type = 'product'
    AND p.post_status = 'publish'
    GROUP BY p.ID, p.post_title, p.post_content, p.post_excerpt, p.post_name, p.post_date, p.post_modified, pm.meta_key, pm.meta_value
  `

  // Group the metadata for each product
  const groupedProducts = products.reduce((acc, curr) => {
    const id = curr.ID.toString()
    if (!acc[id]) {
      acc[id] = {
        ID: curr.ID,
        post_title: curr.post_title,
        post_content: curr.post_content,
        post_excerpt: curr.post_excerpt,
        post_name: curr.post_name,
        post_date: curr.post_date,
        post_modified: curr.post_modified,
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
    post_excerpt: string
    post_name: string
    post_date: Date
    post_modified: Date
    meta: Record<string, string | undefined>
    is_bundle: boolean
  }>)

  // Get all product IDs
  const productIds = Object.keys(groupedProducts).map(id => BigInt(id))
  
  // Fetch product categories
  const productCategories = await prisma.$queryRaw<Array<{
    object_id: bigint
    name: string
  }>>`
    SELECT tr.object_id, t.name
    FROM wp_term_relationships tr
    JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    JOIN wp_terms t ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'product_cat'
    AND tr.object_id IN (${productIds.join(',')})
  `

  // Group categories by product
  const categoriesByProduct: Record<string, string[]> = {}
  productCategories.forEach(category => {
    const productId = category.object_id.toString()
    if (!categoriesByProduct[productId]) {
      categoriesByProduct[productId] = []
    }
    categoriesByProduct[productId].push(category.name)
  })

  // Get bundle items for bundle products
  const bundleIds = Object.values(groupedProducts)
    .filter(product => product.is_bundle)
    .map(product => product.ID)

  let bundledItemsData: Record<string, Array<{
    bundled_item_id: bigint
    product_id: bigint
    bundle_id: bigint
    menu_order: bigint
    child_post_title: string
    child_price: string | null
    child_meta: Record<string, string | null>
  }>> = {}

  if (bundleIds.length > 0) {
    // Get basic bundled items data
    const bundledItems = await prisma.$queryRaw<Array<{
      bundled_item_id: bigint
      product_id: bigint
      bundle_id: bigint
      menu_order: bigint
      child_post_title: string
    }>>`
      SELECT 
        wbi.bundled_item_id,
        wbi.product_id,
        wbi.bundle_id,
        wbi.menu_order,
        child.post_title as child_post_title
      FROM wp_woocommerce_bundled_items wbi
      JOIN wp_posts child ON wbi.product_id = child.ID
      WHERE wbi.bundle_id IN (${bundleIds.join(',')})
      ORDER BY wbi.bundle_id, wbi.menu_order
    `
    
    // Initialize bundled items structure
    bundledItems.forEach(item => {
      const bundleId = item.bundle_id.toString()
      if (!bundledItemsData[bundleId]) {
        bundledItemsData[bundleId] = []
      }
      bundledItemsData[bundleId].push({
        ...item,
        child_price: null,
        child_meta: {}
      })
    })
    
    // Get all bundled item IDs
    const bundledItemIds = bundledItems.map(item => item.bundled_item_id)
    
    // Get product prices for bundled items
    const bundledProductPrices = await prisma.$queryRaw<Array<{
      product_id: bigint
      meta_value: string | null
    }>>`
      SELECT 
        post_id as product_id,
        meta_value
      FROM wp_postmeta
      WHERE post_id IN (${bundledItems.map(item => item.product_id).join(',')})
      AND meta_key = '_price'
    `
    
    // Map prices to bundled items
    bundledProductPrices.forEach(priceData => {
      const productId = priceData.product_id
      for (const bundleId in bundledItemsData) {
        bundledItemsData[bundleId].forEach(item => {
          if (item.product_id === productId) {
            item.child_price = priceData.meta_value
          }
        })
      }
    })
    
    // Get all bundled item metadata
    const bundledItemMetadata = await prisma.$queryRaw<Array<{
      bundled_item_id: bigint
      meta_key: string
      meta_value: string | null
    }>>`
      SELECT 
        bundled_item_id,
        meta_key,
        meta_value
      FROM wp_woocommerce_bundled_itemmeta
      WHERE bundled_item_id IN (${bundledItemIds.join(',')})
    `

    // Get stock information for bundled items
    const bundledItemStock = await prisma.$queryRaw<Array<{
      post_id: bigint
      meta_value: string | null
    }>>`
      SELECT 
        post_id,
        meta_value
      FROM wp_postmeta
      WHERE post_id IN (${bundledItems.map(item => item.product_id).join(',')})
      AND meta_key = '_stock'
    `
    
    // Add metadata to bundled items
    bundledItemMetadata.forEach(meta => {
      const itemId = meta.bundled_item_id
      for (const bundleId in bundledItemsData) {
        const itemIndex = bundledItemsData[bundleId].findIndex(item => item.bundled_item_id === itemId)
        if (itemIndex >= 0 && meta.meta_key) {
          bundledItemsData[bundleId][itemIndex].child_meta[meta.meta_key] = meta.meta_value
        }
      }
    })

    // Add stock information to bundled items
    bundledItemStock.forEach(stockData => {
      const productId = stockData.post_id
      for (const bundleId in bundledItemsData) {
        bundledItemsData[bundleId].forEach(item => {
          if (item.product_id === productId) {
            item.child_meta['_stock'] = stockData.meta_value
          }
        })
      }
    })
  }

  // Create final product structure with all data
  const constructionProducts = Object.values(groupedProducts)
    .map((product) => {
      const isBundle = product.is_bundle
      const productId = product.ID.toString()
      const productCategories = categoriesByProduct[productId] || 
        (product.post_title.toLowerCase().includes("scaffold") ? ["Scaffolding"] : ["Safety"])
      
      const bundledItems = isBundle && bundledItemsData[productId] 
        ? bundledItemsData[productId].map(item => ({
            id: Number(item.bundled_item_id),
            productId: Number(item.product_id),
            name: item.child_post_title,
            price: Number(item.child_price || 0),
            defaultQuantity: Number(item.child_meta['default_quantity'] || 1),
            minQuantity: Number(item.child_meta['min_quantity'] || 1),
            maxQuantity: Number(item.child_meta['max_quantity'] || 10),
            optional: item.child_meta['optional'] === 'yes',
            menuOrder: Number(item.menu_order),
            visibility: item.child_meta['visibility'] || 'visible',
            discount: item.child_meta['discount'] || null,
            priceVisibility: item.child_meta['price_visibility'] || 'visible',
            stock: Number(item.child_meta['_stock'] || 0),
            allMeta: item.child_meta
          }))
        : undefined

      // Get on sale status
      const regularPrice = Number(product.meta['_regular_price'] || 0)
      const salePrice = Number(product.meta['_sale_price'] || 0)
      const isOnSale = product.meta['_sale_price'] !== undefined && 
                     salePrice > 0 && 
                     salePrice < regularPrice

      return {
        id: Number(product.ID),
        name: product.post_title,
        description: product.post_content,
        excerpt: product.post_excerpt,
        slug: product.post_name,
        dateCreated: product.post_date,
        dateModified: product.post_modified,
        price: Number(product.meta['_price'] || 0),
        regularPrice: regularPrice,
        salePrice: salePrice,
        stock: Number(product.meta['_stock'] || 0),
        stockStatus: product.meta['_stock_status'] || 'instock',
        manageStock: product.meta['_manage_stock'] === 'yes',
        sku: product.meta['_sku'],
        virtual: product.meta['_virtual'] === 'yes',
        downloadable: product.meta['_downloadable'] === 'yes',
        taxStatus: product.meta['_tax_status'] || 'taxable',
        taxClass: product.meta['_tax_class'] || '',
        weight: product.meta['_weight'] || '',
        length: product.meta['_length'] || '',
        width: product.meta['_width'] || '',
        height: product.meta['_height'] || '',
        categories: productCategories,
        onSale: isOnSale,
        type: isBundle ? "bundle" as const : "simple" as const,
        bundledItems,
        allMeta: product.meta
      }
    })
    console.log(constructionProducts)
  return <POSClient products={constructionProducts} />
}

