"use client";

import { useState, useEffect } from "react";
import type { CartItem, CustomizedBundleItem, Product } from "@/types/pos";
import { toast } from "@/components/ui/use-toast";
import { BundleCustomizationDialog } from "@/components/pos/bundle-customization-dialog";
import { createOrder } from "@/lib/woocommerce";

// Import the new components
import { POSHeader } from "@/components/pos/pos-header";
import { POSCompatibilityWarnings } from "@/components/pos/pos-compatibility-warnings";
import { POSProductSection } from "@/components/pos/pos-product-section";
import { POSCartSection } from "@/components/pos/pos-cart-section";
import { POSOrderConfirmationDialog } from "@/components/pos/pos-order-confirmation-dialog";

interface POSClientProps {
  products: Product[];
}

export function POSClient({ products }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<Product | null>(null);
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([]);
  const [expandedBundleItems, setExpandedBundleItems] = useState<Record<string, boolean>>({});
  const [editingBundleInCart, setEditingBundleInCart] = useState<{
    index: number;
    open: boolean;
  }>({
    index: -1,
    open: false,
  });

  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Sort cart to prioritize bundles at the top
  useEffect(() => {
    if (cart.length > 0) {
      const sortedCart = [...cart].sort((a, b) => {
        // Bundles come first
        if (a.type === "bundle" && b.type !== "bundle") return -1;
        if (a.type !== "bundle" && b.type === "bundle") return 1;
        return 0;
      });

      if (JSON.stringify(sortedCart) !== JSON.stringify(cart)) {
        setCart(sortedCart);
      }
    }
  }, [cart]);

  // Check for compatibility warnings in the cart
  useEffect(() => {
    const warnings: string[] = [];

    // Get all bundle items in the cart
    const allBundleItems = cart
      .filter((item) => item.type === "bundle" && item.bundleItems)
      .flatMap((item) => item.bundleItems || [])
      .filter((item) => item.quantity > 0);

    // Check if we have frames but no braces
    const hasFrames = allBundleItems.some((item) =>
      item.name.toLowerCase().includes("frame")
    );
    const hasBraces = allBundleItems.some((item) =>
      item.name.toLowerCase().includes("brace")
    );

    if (hasFrames && !hasBraces) {
      warnings.push("Your cart has scaffold frames but no cross braces");
    }

    // Check if we have platforms but no frames
    const hasPlatforms = allBundleItems.some((item) =>
      item.name.toLowerCase().includes("platform")
    );

    if (hasPlatforms && !hasFrames) {
      warnings.push("Your cart has platforms but no scaffold frames");
    }

    // Check if we have guardrails but no platforms
    const hasGuardrails = allBundleItems.some((item) =>
      item.name.toLowerCase().includes("guardrail")
    );

    if (hasGuardrails && !hasPlatforms) {
      warnings.push("Your cart has guardrails but no platforms");
    }

    setCompatibilityWarnings(warnings);
  }, [cart]);

  const addToCart = (product: Product) => {
    // If it's a bundle, open the customization dialog
    if (product.type === "bundle" && product.bundledItems) {
      setSelectedBundle(product);
      setEditingCartItemIndex(null);
      setIsBundleDialogOpen(true);
      return;
    }

    // For simple products, add directly to cart
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    toast({
      title: "Item added",
      description: `${product.name} added to cart`,
      duration: 2000,
    });
  };

  const addBundleToCart = (
    product: Product,
    customizedItems: CustomizedBundleItem[]
  ) => {
    if (editingCartItemIndex !== null) {
      // Update existing cart item
      setCart((prevCart) => {
        const newCart = [...prevCart];
        newCart[editingCartItemIndex] = {
          ...product,
          quantity: prevCart[editingCartItemIndex].quantity,
          bundleItems: customizedItems,
        };
        return newCart;
      });

      toast({
        title: "Bundle updated",
        description: `${product.name} has been updated in your cart`,
        duration: 2000,
      });
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
        ];
      });

      toast({
        title: "Bundle added",
        description: `${product.name} added to cart`,
        duration: 2000,
      });
    }
  };

  const removeFromCart = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const updateBundleItemQuantity = (
    cartIndex: number,
    bundleItemId: number,
    newQuantity: number
  ) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      const cartItem = updatedCart[cartIndex];

      if (cartItem.type === "bundle" && cartItem.bundleItems) {
        const updatedBundleItems = cartItem.bundleItems.map((item) => {
          if (item.id === bundleItemId) {
            // Ensure quantity is within allowed limits
            const validQuantity = Math.max(
              item.minQuantity,
              Math.min(newQuantity, item.maxQuantity)
            );
            return { ...item, quantity: validQuantity };
          }
          return item;
        });

        updatedCart[cartIndex] = {
          ...cartItem,
          bundleItems: updatedBundleItems,
        };
      }

      return updatedCart;
    });
  };

  const updateBundleItemOption = (
    cartIndex: number,
    bundleItemId: number,
    optionName: string,
    optionValue: string
  ) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      const cartItem = updatedCart[cartIndex];

      if (cartItem.type === "bundle" && cartItem.bundleItems) {
        const updatedBundleItems = cartItem.bundleItems.map((item) => {
          if (item.id === bundleItemId) {
            return {
              ...item,
              selectedOptions: {
                ...item.selectedOptions,
                [optionName]: optionValue,
              },
            };
          }
          return item;
        });

        updatedCart[cartIndex] = {
          ...cartItem,
          bundleItems: updatedBundleItems,
        };
      }

      return updatedCart;
    });
  };

  const toggleBundleItemsVisibility = (index: number) => {
    setExpandedBundleItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleInCartBundleEditor = (index: number) => {
    if (editingBundleInCart.index === index && editingBundleInCart.open) {
      setEditingBundleInCart({ index: -1, open: false });
    } else {
      setEditingBundleInCart({ index, open: true });
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    // Only proceed if cart has items
    if (cart.length === 0) return;

    // Calculate totals
    const subtotal = calculateTotal();
    const taxAmount = subtotal * 0.1;
    const total = subtotal + taxAmount;

    // Prepare order data
    const orderData = {
      items: cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        sku: item.sku || "",
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        type: item.type || "simple",
        bundleItems: item.bundleItems || [],
        tax_amount: item.price * item.quantity * 0.1,
      })),
      subtotal,
      tax_total: taxAmount,
      total,
      payment_method: "cash",
      status: "processing",
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
        total,
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
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      <POSCompatibilityWarnings warnings={compatibilityWarnings} />
      
      <POSHeader title="Point of Sale" />

      <div className="flex flex-1 gap-6 overflow-hidden">
        <POSProductSection 
          products={products} 
          onAddToCart={addToCart} 
        />

        <POSCartSection
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onToggleBundleItems={toggleBundleItemsVisibility}
          onToggleBundleEditor={toggleInCartBundleEditor}
          onUpdateBundleItemQuantity={updateBundleItemQuantity}
          onUpdateBundleItemOption={updateBundleItemOption}
          onCloseBundleEditor={() => setEditingBundleInCart({ index: -1, open: false })}
          expandedBundleItems={expandedBundleItems}
          editingBundleInCart={editingBundleInCart}
          subtotal={calculateTotal()}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Bundle Customization Dialog */}
      {selectedBundle && (
        <BundleCustomizationDialog
          open={isBundleDialogOpen}
          onOpenChange={setIsBundleDialogOpen}
          product={selectedBundle}
          allProducts={products}
          onAddToCart={addBundleToCart}
        />
      )}

      {/* Order Confirmation Dialog */}
      <POSOrderConfirmationDialog
        open={orderComplete}
        onOpenChange={setOrderComplete}
        orderDetails={orderDetails}
      />
    </div>
  );
}
