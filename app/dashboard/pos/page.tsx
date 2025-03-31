import { prisma } from "@/lib/prisma"
import {POSClient} from "@/components/pos/pos-client"

export default async function POSPage() {
  const products = await prisma.$queryRaw<Array<{
    ID: bigint
    post_title: string
    post_content: string
    meta_key: string | null
    meta_value: string | null
  }>>`
    SELECT p.ID, p.post_title, p.post_content, pm.meta_key, pm.meta_value
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key IN (
      '_price', '_regular_price', '_sku', '_stock', '_stock_status', 
      '_manage_stock', '_virtual', '_downloadable'
    )
    WHERE p.post_type = 'product'
    AND p.post_status = 'publish'
  `

  const groupedProducts = products.reduce((acc, curr) => {
    const id = curr.ID.toString()
    if (!acc[id]) {
      acc[id] = {
        ID: curr.ID,
        post_title: curr.post_title,
        post_content: curr.post_content,
        meta: {}
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
  }>)

  const constructionProducts = Object.values(groupedProducts)
    .map((product) => ({
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
      type: "simple" as const,
    }))

    console.log(constructionProducts)

  return <POSClient products={constructionProducts} />
}

