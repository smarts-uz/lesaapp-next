"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Info, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { CustomizedBundleItem, Product, CartItem } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface BundleCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  allProducts: Product[];
  onAddToCart: (
    product: Product,
    customizedItems: CustomizedBundleItem[]
  ) => void;
  isEditing?: boolean;
  initialQuantity?: number;
}

// Quantity control component for reusability
export interface QuantityControlProps {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  onQuantityChange: (newQuantity: number) => void;
  label?: string;
  tooltipContent?: string;
  size?: 'default' | 'sm';
}

export function QuantityControl({
  quantity,
  minQuantity,
  maxQuantity,
  onQuantityChange,
  label,
  tooltipContent,
  size = 'default'
}: QuantityControlProps) {
  const buttonSize = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const inputWidth = size === 'sm' ? 'w-12' : 'w-16';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      // Ensure the value is within bounds
      const newValue = Math.max(minQuantity, Math.min(value, maxQuantity));
      onQuantityChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers, backspace, delete, and arrow keys
    if (
      !/[\d\b]/.test(e.key) && 
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex items-center justify-between">
      {label && (
        <div className="flex items-center gap-1">
          <Label className="text-xs">{label}</Label>
          {tooltipContent && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} rounded-none`}
          onClick={() => onQuantityChange(quantity - 1)}
          disabled={quantity <= minQuantity}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <input
          type="text"
          value={quantity}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`${inputWidth} text-center ${textSize} border-none focus:outline-none focus:ring-0`}
          min={minQuantity}
          max={maxQuantity}
        />
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} rounded-none`}
          onClick={() => onQuantityChange(quantity + 1)}
          disabled={quantity >= maxQuantity}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Bundle item component
interface BundleItemProps {
  item: CustomizedBundleItem;
  onQuantityChange: (itemId: number, newQuantity: number) => void;
}

function BundleItem({ item, onQuantityChange }: BundleItemProps) {
  return (
    <div className="space-y-3 pb-3 border-b last:border-0">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
          <Image
            src={item.image || "/placeholder.svg?height=64&width=64"}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{item.name}</h4>
              <span className="text-sm text-muted-foreground">
                Stock: {item.stock}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Bundle component</p>

          <div className="mt-2 space-y-2">
            <QuantityControl
              quantity={item.quantity}
              minQuantity={item.minQuantity}
              maxQuantity={item.maxQuantity}
              onQuantityChange={(newQuantity) => onQuantityChange(item.id, newQuantity)}
              label="Quantity"
              tooltipContent={`Min: ${item.minQuantity}, Max: ${item.maxQuantity}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Compatibility warnings component
interface CompatibilityWarningsProps {
  warnings: string[];
}

function CompatibilityWarnings({ warnings }: CompatibilityWarningsProps) {
  if (warnings.length === 0) return null;
  
  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Compatibility Warning</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 mt-2">
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export function BundleCustomizationDialog({
  open,
  onOpenChange,
  product,
  allProducts,
  onAddToCart,
  isEditing = false,
  initialQuantity = 1,
}: BundleCustomizationDialogProps) {
  const [customizedItems, setCustomizedItems] = useState<CustomizedBundleItem[]>([]);
  const [bundleQuantity, setBundleQuantity] = useState(initialQuantity);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([]);
  
  // Calculate total price based on bundle quantity
  const totalPrice = useMemo(() => product.price * bundleQuantity, [product.price, bundleQuantity]);

  // Reset state function
  const resetState = useCallback(() => {
    setBundleQuantity(initialQuantity);
    setCompatibilityWarnings([]);
  }, [initialQuantity]);

  // Initialize customized items when the dialog opens
  useEffect(() => {
    if (open) {
      let initialItems: CustomizedBundleItem[] = [];
      const cartItem = product as CartItem;
      
      if (isEditing && cartItem.bundleItems) {
        // Use existing bundle items when editing
        initialItems = cartItem.bundleItems;
        setBundleQuantity(cartItem.quantity);
      } else if (product.bundledItems) {
        // Create new bundle items
        initialItems = product.bundledItems.map((item) => {
          // Find the corresponding simple product to get stock information
          const simpleProduct = allProducts.find((p) => p.id === item.productId);

          return {
            ...item,
            quantity: item.defaultQuantity,
            minQuantity: item.minQuantity || 1,
            maxQuantity: item.maxQuantity || 999,
            stock: simpleProduct?.stock || 0,
            selectedOptions:
              item.variations?.reduce((acc, variation) => {
                acc[variation.name] = variation.options[0];
                return acc;
              }, {} as Record<string, string>) || {},
          };
        });
      }

      setCustomizedItems(initialItems);
    } else {
      resetState();
    }
  }, [open, product, allProducts, resetState, isEditing]);

  const handleBundleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1;
    setBundleQuantity(newQuantity);
    
    // Update bundled items quantities proportionally
    const updatedItems = customizedItems.map(item => {
      // Calculate the ratio of the new quantity to the current bundle quantity
      const ratio = newQuantity / bundleQuantity;
      // Calculate the new quantity for this item, maintaining the same ratio
      const newItemQuantity = Math.round(item.quantity * ratio);
      
      // Ensure the new quantity is within the min/max limits
      const validQuantity = Math.max(
        item.minQuantity,
        Math.min(newItemQuantity, item.maxQuantity)
      );
      
      return {
        ...item,
        quantity: validQuantity
      };
    });
    
    setCustomizedItems(updatedItems);
  }, [bundleQuantity, customizedItems]);

  const handleQuantityChange = useCallback((itemId: number, newQuantity: number) => {
    const item = customizedItems.find((i) => i.id === itemId);
    if (!item) return;
    
    // Ensure quantity is within min/max limits
    const validQuantity = Math.max(
      item.minQuantity,
      Math.min(newQuantity, item.maxQuantity)
    );
    
    const updatedItems = customizedItems.map((i) =>
      i.id === itemId ? { ...i, quantity: validQuantity } : i
    );
    
    setCustomizedItems(updatedItems);
  }, [customizedItems]);

  const handleAddToCart = useCallback(() => {
    // Filter out items with quantity 0
    const finalItems = customizedItems.filter((item) => item.quantity > 0);

    // Update the product price to match our calculated total
    const updatedProduct = {
      ...product,
      price: product.price, // Keep original price
      quantity: bundleQuantity, // Set the bundle quantity
      bundleItems: finalItems, // Add bundle items to the product
    };

    onAddToCart(updatedProduct, finalItems);
    
    // Reset state
    resetState();
    
    // Close the dialog
    onOpenChange(false);
  }, [customizedItems, onAddToCart, onOpenChange, product, resetState, bundleQuantity]);

  // Filter visible items (non-optional or with quantity > 0)
  const visibleItems = useMemo(() => 
    customizedItems.filter((item) => !item.optional || item.quantity > 0),
    [customizedItems]
  );

  // Update bundle quantity when initialQuantity changes
  useEffect(() => {
    if (isEditing) {
      setBundleQuantity((product as CartItem).quantity);
    }
  }, [isEditing, product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Bundle' : 'Customize Scaffolding Bundle'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Adjust quantities and options for the bundle components'
              : 'Configure quantities and options for the scaffolding components in this bundle'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Label>Bundle Quantity</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of bundles to purchase</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <QuantityControl
            quantity={bundleQuantity}
            minQuantity={1}
            maxQuantity={999}
            onQuantityChange={handleBundleQuantityChange}
          />
        </div>

        <CompatibilityWarnings warnings={compatibilityWarnings} />

        <div className="flex-1 overflow-hidden">
          {/* Bundle Components */}
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="font-medium mb-2">Bundle Components</h3>
            <ScrollArea className="flex-1 border rounded-md p-2">
              <div className="space-y-4 pr-4">
                {visibleItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No components in this bundle.
                  </div>
                ) : (
                  visibleItems.map((item) => (
                    <BundleItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 items-center pt-4 border-t mt-4">
          <div className="text-lg font-bold mr-auto">
            Total: {formatCurrency(totalPrice)}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart}>
            {isEditing ? 'Save Changes' : 'Add to Cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
