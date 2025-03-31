"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Tag,
  Package,
  Edit,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Image from "next/image"
import { fetchProducts } from "@/lib/woocommerce"
import type { CartItem, CustomizedBundleItem, Product } from "@/types/pos"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { BundleCustomizationDialog } from "@/components/pos/bundle-customization-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { InCartBundleEditor } from "@/components/pos/in-cart-bundle-editor"
import { RefundButton } from "@/components/pos/refund-button"

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBundle, setSelectedBundle] = useState<Product | null>(null)
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false)
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null)
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([])
  const [expandedBundleItems, setExpandedBundleItems] = useState<Record<string, boolean>>({})
  const [editingBundleInCart, setEditingBundleInCart] = useState<{ index: number; open: boolean }>({
    index: -1,
    open: false,
  })

  // Simulate fetching products from WooCommerce
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // In a real implementation, this would call the WooCommerce API
        const data = await fetchProducts()

        // Filter to only show scaffolding and construction supplies
        const constructionProducts = data.filter(
          (product) => product.categories.includes("Scaffolding") || product.categories.includes("Safety"),
        )

        setProducts(constructionProducts)
        setFilteredProducts(constructionProducts)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(constructionProducts.flatMap((product) => product.categories)))
        setCategories(uniqueCategories)

        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch products:", error)
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Sort cart to prioritize bundles at the top
  useEffect(() => {
    if (cart.length > 0) {
      const sortedCart = [...cart].sort((a, b) => {
        // Bundles come first
        if (a.type === "bundle" && b.type !== "bundle") return -1
        if (a.type !== "bundle" && b.type === "bundle") return 1
        return 0
      })

      if (JSON.stringify(sortedCart) !== JSON.stringify(cart)) {
        setCart(sortedCart)
      }
    }
  }, [cart])

  // Filter products based on search query and active category
  useEffect(() => {
    let filtered = products

    if (searchQuery) {
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (activeCategory !== "all") {
      filtered = filtered.filter((product) => product.categories.includes(activeCategory))
    }

    setFilteredProducts(filtered)
  }, [searchQuery, activeCategory, products])

  // Check for compatibility warnings in the cart
  useEffect(() => {
    const warnings: string[] = []

    // Get all bundle items in the cart
    const allBundleItems = cart
      .filter((item) => item.type === "bundle" && item.bundleItems)
      .flatMap((item) => item.bundleItems || [])
      .filter((item) => item.quantity > 0)

    // Check if we have frames but no braces
    const hasFrames = allBundleItems.some((item) => item.name.toLowerCase().includes("frame"))

    const hasBraces = allBundleItems.some((item) => item.name.toLowerCase().includes("brace"))

    if (hasFrames && !hasBraces) {
      warnings.push("Your cart has scaffold frames but no cross braces")
    }

    // Check if we have platforms but no frames
    const hasPlatforms = allBundleItems.some((item) => item.name.toLowerCase().includes("platform"))

    if (hasPlatforms && !hasFrames) {
      warnings.push("Your cart has platforms but no scaffold frames")
    }

    // Check if we have guardrails but no platforms
    const hasGuardrails = allBundleItems.some((item) => item.name.toLowerCase().includes("guardrail"))

    if (hasGuardrails && !hasPlatforms) {
      warnings.push("Your cart has guardrails but no platforms")
    }

    setCompatibilityWarnings(warnings)
  }, [cart])

  const addToCart = (product: Product) => {
    // If it's a bundle, open the customization dialog
    if (product.type === "bundle" && product.bundledItems) {
      setSelectedBundle(product)
      setEditingCartItemIndex(null)
      setIsBundleDialogOpen(true)
      return
    }

    // For simple products, add directly to cart
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })

    toast({
      title: "Item added",
      description: `${product.name} added to cart`,
      duration: 2000,
    })
  }

  const addBundleToCart = (product: Product, customizedItems: CustomizedBundleItem[]) => {
    if (editingCartItemIndex !== null) {
      // Update existing cart item
      setCart((prevCart) => {
        const newCart = [...prevCart]
        newCart[editingCartItemIndex] = {
          ...product,
          quantity: prevCart[editingCartItemIndex].quantity,
          bundleItems: customizedItems,
        }
        return newCart
      })

      toast({
        title: "Bundle updated",
        description: `${product.name} has been updated in your cart`,
        duration: 2000,
      })
    } else {
      // Add new bundle to cart
      setCart((prevCart) => {
        // For bundles, we always add a new item since each can be customized differently
        return [
          ...prevCart,
          {
            ...product,
            quantity: 1,
            bundleItems: customizedItems,
          },
        ]
      })

      toast({
        title: "Bundle added",
        description: `${product.name} added to cart`,
        duration: 2000,
      })
    }
  }

  const removeFromCart = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setCart((prevCart) => prevCart.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item)))
  }

  const updateBundleItemQuantity = (cartIndex: number, bundleItemId: number, newQuantity: number) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart]
      const cartItem = updatedCart[cartIndex]

      if (cartItem.type === "bundle" && cartItem.bundleItems) {
        const updatedBundleItems = cartItem.bundleItems.map((item) => {
          if (item.id === bundleItemId) {
            // Ensure quantity is within allowed limits
            const validQuantity = Math.max(item.minQuantity, Math.min(newQuantity, item.maxQuantity))
            return { ...item, quantity: validQuantity }
          }
          return item
        })

        // Recalculate bundle price based on items
        const bundleItemsPrice = updatedBundleItems.reduce((total, item) => {
          return total + item.price * item.quantity
        }, 0)

        // Apply bundle discount (10%)
        const bundleDiscount = bundleItemsPrice * 0.1
        const adjustedPrice = bundleItemsPrice - bundleDiscount

        updatedCart[cartIndex] = {
          ...cartItem,
          bundleItems: updatedBundleItems,
          price: adjustedPrice > 0 ? adjustedPrice : 0,
        }
      }

      return updatedCart
    })
  }

  const updateBundleItemOption = (cartIndex: number, bundleItemId: number, optionName: string, optionValue: string) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart]
      const cartItem = updatedCart[cartIndex]

      if (cartItem.type === "bundle" && cartItem.bundleItems) {
        const updatedBundleItems = cartItem.bundleItems.map((item) => {
          if (item.id === bundleItemId) {
            return {
              ...item,
              selectedOptions: {
                ...item.selectedOptions,
                [optionName]: optionValue,
              },
            }
          }
          return item
        })

        updatedCart[cartIndex] = {
          ...cartItem,
          bundleItems: updatedBundleItems,
        }
      }

      return updatedCart
    })
  }

  const editBundleInCart = (index: number) => {
    const cartItem = cart[index]
    if (cartItem.type === "bundle" && cartItem.bundleItems) {
      // Find the original product to get the bundledItems structure
      const originalProduct = products.find((p) => p.id === cartItem.id)
      if (originalProduct && originalProduct.type === "bundle") {
        setSelectedBundle({
          ...originalProduct,
          // Keep the price from the cart item in case it was modified
          price: cartItem.price,
        })
        setEditingCartItemIndex(index)
        setIsBundleDialogOpen(true)
      }
    }
  }

  const toggleBundleItemsVisibility = (index: number) => {
    setExpandedBundleItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const toggleInCartBundleEditor = (index: number) => {
    if (editingBundleInCart.index === index && editingBundleInCart.open) {
      setEditingBundleInCart({ index: -1, open: false })
    } else {
      setEditingBundleInCart({ index, open: true })
    }
  }

  const calculateItemTotal = (item: CartItem) => {
    return item.price * item.quantity
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + calculateItemTotal(item), 0)
  }

  const handleCheckout = () => {
    // In a real implementation, this would create an order in WooCommerce
    toast({
      title: "Order created",
      description: `Order total: ${formatCurrency(calculateTotal())}`,
      duration: 3000,
    })

    setCart([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      {compatibilityWarnings.length > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Compatibility Warning</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2">
              {compatibilityWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <div className="flex gap-2">
          <RefundButton />
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Products Section */}
        <div className="flex flex-col w-2/3 h-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search scaffolding products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <TabsList className="mb-4 flex flex-wrap h-auto">
              <TabsTrigger value="all" onClick={() => setActiveCategory("all")} className="mb-1">
                All
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  onClick={() => setActiveCategory(category)}
                  className="mb-1"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="flex-1 mt-0">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-muted"></div>
                        <div className="p-3">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-4 w-1/2 bg-muted rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square relative">
                            <Image
                              src={product.image || "/placeholder.svg?height=200&width=200"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            {product.onSale && <Badge className="absolute top-2 right-2 bg-red-500">Sale</Badge>}
                            {product.type === "bundle" && (
                              <Badge className="absolute top-2 left-2 bg-blue-500">Bundle</Badge>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-1">
                              <h3 className="font-medium line-clamp-1">{product.name}</h3>
                              {product.type === "bundle" && <Package className="h-3 w-3 text-blue-500" />}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold">{formatCurrency(product.price)}</span>
                              {product.stock <= 5 && (
                                <span className="text-xs text-muted-foreground">{product.stock} left</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredProducts.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No products found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search or filter to find what you're looking for.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Cart Section */}
        <div className="w-1/3 h-full flex flex-col border rounded-lg bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Current Order
            </h2>
          </div>

          {cart.length > 0 ? (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg?height=64&width=64"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="font-medium truncate">{item.name}</h4>
                            {item.type === "bundle" && <Package className="h-3 w-3 text-blue-500" />}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-medium">{formatCurrency(calculateItemTotal(item))}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {item.type === "bundle" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => toggleInCartBundleEditor(index)}
                                title="Edit bundle quantities"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => toggleBundleItemsVisibility(index)}
                                title={expandedBundleItems[index] ? "Collapse bundle items" : "Expand bundle items"}
                              >
                                {expandedBundleItems[index] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Bundle items details - collapsible */}
                      {item.type === "bundle" && item.bundleItems && item.bundleItems.length > 0 && (
                        <Collapsible open={expandedBundleItems[index]}>
                          <CollapsibleContent>
                            <div className="pl-8 space-y-2">
                              {item.bundleItems
                                .filter((bundleItem) => bundleItem.quantity > 0)
                                .map((bundleItem) => (
                                  <div key={bundleItem.id} className="text-sm border-l-2 pl-3 py-1">
                                    <div className="flex justify-between">
                                      <span className="font-medium">{bundleItem.name}</span>
                                      <span>x{bundleItem.quantity}</span>
                                    </div>
                                    {bundleItem.selectedOptions &&
                                      Object.entries(bundleItem.selectedOptions).length > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {Object.entries(bundleItem.selectedOptions).map(([key, value]) => (
                                            <div key={key}>
                                              {key}: <span className="font-medium">{value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* In-cart bundle editor */}
                      {item.type === "bundle" && editingBundleInCart.index === index && editingBundleInCart.open && (
                        <InCartBundleEditor
                          bundle={item}
                          onUpdateQuantity={(bundleItemId, quantity) =>
                            updateBundleItemQuantity(index, bundleItemId, quantity)
                          }
                          onUpdateOption={(bundleItemId, optionName, optionValue) =>
                            updateBundleItemOption(index, bundleItemId, optionName, optionValue)
                          }
                          onClose={() => setEditingBundleInCart({ index: -1, open: false })}
                        />
                      )}

                      <Separator />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(calculateTotal() * 0.1)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal() * 1.1)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button variant="outline" className="w-full">
                    <Tag className="mr-2 h-4 w-4" />
                    Discount
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full">
                    <Banknote className="mr-2 h-4 w-4" />
                    Cash
                  </Button>
                  <Button className="w-full" onClick={handleCheckout}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Card
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Your cart is empty</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Add scaffolding products by clicking on them in the product grid
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bundle Customization Dialog */}
      {selectedBundle && (
        <BundleCustomizationDialog
          open={isBundleDialogOpen}
          onOpenChange={setIsBundleDialogOpen}
          product={selectedBundle}
          onAddToCart={addBundleToCart}
        />
      )}
    </div>
  )
}

