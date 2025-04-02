"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ShoppingCart, AlertCircle } from "lucide-react"
import type { CartItem, CustomizedBundleItem, Product } from "@/types/pos"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { BundleCustomizationDialog } from "@/components/pos/bundle-customization-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefundButton } from "@/components/pos/refund-button"
import { ProductGrid } from "@/components/pos/product-grid"
import { CartItem as CartItemComponent } from "@/components/pos/cart-item"
import { CartSummary } from "@/components/pos/cart-summary"
import { createOrder } from "@/lib/woocommerce"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface POSClientProps {
  products: Product[]
}

export function POSClient({ products }: POSClientProps) {
  // Extract unique categories from product names
  const categories = Array.from(new Set(
    products.map(product => 
      product.name.toLowerCase().includes("scaffold") ? "Scaffolding" : "Safety"
    )
  ))

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
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

  const [orderComplete, setOrderComplete] = useState(false)
  const [orderDetails, setOrderDetails] = useState<any>(null)

  // Set loading to false when products are available
  useEffect(() => {
    if (products.length > 0) {
      setIsLoading(false)
    }
  }, [products])

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
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(activeCategory.toLowerCase()))
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

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    // Only proceed if cart has items
    if (cart.length === 0) return;
    
    // Calculate totals
    const subtotal = calculateTotal();
    const taxAmount = subtotal * 0.1;
    const total = subtotal + taxAmount;
    
    // Prepare order data
    const orderData = {
      items: cart.map(item => ({
        product_id: item.id,
        name: item.name,
        sku: item.sku || '',
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        type: item.type || 'simple',
        bundleItems: item.bundleItems || [],
        tax_amount: (item.price * item.quantity) * 0.1,
      })),
      subtotal,
      tax_total: taxAmount,
      total,
      payment_method: "cash",
      status: "processing"
    };
    
    try {
      // Create order in database
      const order = await createOrder(orderData);
      
      // Set order details for confirmation dialog
      setOrderDetails({
        ...order,
        items: orderData.items,
        subtotal,
        tax_total: taxAmount,
        total
      });
      
      // Show order completion dialog
      setOrderComplete(true);
      
      // Clear cart after successful order
      setCart([]);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
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
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <ProductGrid
                  products={filteredProducts}
                  isLoading={isLoading}
                  onAddToCart={addToCart}
                />
              </ScrollArea>
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
                    <CartItemComponent
                      key={`${item.id}-${index}`}
                      item={item}
                      index={index}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      onToggleBundleItems={toggleBundleItemsVisibility}
                      onToggleBundleEditor={toggleInCartBundleEditor}
                      onUpdateBundleItemQuantity={updateBundleItemQuantity}
                      onUpdateBundleItemOption={updateBundleItemOption}
                      onCloseBundleEditor={() => setEditingBundleInCart({ index: -1, open: false })}
                      isExpanded={expandedBundleItems[index]}
                      isEditing={editingBundleInCart.index === index && editingBundleInCart.open}
                    />
                  ))}
                </div>
              </ScrollArea>

              <CartSummary subtotal={calculateTotal()} onCheckout={handleCheckout} />
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

      {/* Order Confirmation Dialog */}
      {orderDetails && (
        <Dialog open={orderComplete} onOpenChange={setOrderComplete}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Order #{orderDetails.id} Created</DialogTitle>
              <DialogDescription>
                Order details have been successfully saved
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg p-3 my-2">
              <div className="text-sm space-y-1">
                <p className="font-medium">Date: {new Date(orderDetails.date).toLocaleString()}</p>
                <p className="font-medium">Status: {orderDetails.status}</p>
                <p className="font-medium">Payment Method: {orderDetails.payment_method}</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-3 my-2">
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm border-b pb-1">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs">{item.quantity} x {formatCurrency(item.price)}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border rounded-lg p-3 my-2">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(orderDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(orderDetails.tax_total)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderDetails.total)}</span>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setOrderComplete(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 