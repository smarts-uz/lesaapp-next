"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Info, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { CustomizedBundleItem, Product } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BundleCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onAddToCart: (
    product: Product,
    customizedItems: CustomizedBundleItem[]
  ) => void;
}

export function BundleCustomizationDialog({
  open,
  onOpenChange,
  product,
  onAddToCart,
}: BundleCustomizationDialogProps) {
  const [customizedItems, setCustomizedItems] = useState<
    CustomizedBundleItem[]
  >([]);
  const [totalPrice, setTotalPrice] = useState(product.price);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>(
    []
  );

  // Initialize customized items when the dialog opens
  useEffect(() => {
    if (open && product.bundledItems) {
      const initialItems = product.bundledItems.map((item) => ({
        ...item,
        quantity: item.defaultQuantity,
        selectedOptions:
          item.variations?.reduce((acc, variation) => {
            acc[variation.name] = variation.options[0];
            return acc;
          }, {} as Record<string, string>) || {},
      }));

      setCustomizedItems(initialItems);
      calculateTotalPrice(initialItems);
    }
  }, [open, product]);

  // Check for compatibility warnings
  useEffect(() => {
    const warnings: string[] = [];

    // Check if we have frames but no braces
    const hasFrames = customizedItems.some(
      (item) => item.quantity > 0 && item.name.toLowerCase().includes("frame")
    );
    const hasBraces = customizedItems.some(
      (item) => item.quantity > 0 && item.name.toLowerCase().includes("brace")
    );

    if (hasFrames && !hasBraces) {
      warnings.push(
        "Scaffold frames typically require cross braces for stability"
      );
    }

    // Check if we have platforms but no frames
    const hasPlatforms = customizedItems.some(
      (item) =>
        item.quantity > 0 && item.name.toLowerCase().includes("platform")
    );

    if (hasPlatforms && !hasFrames) {
      warnings.push("Scaffold platforms require frames for support");
    }

    // Check if we have guardrails but no platforms
    const hasGuardrails = customizedItems.some(
      (item) =>
        item.quantity > 0 && item.name.toLowerCase().includes("guardrail")
    );

    if (hasGuardrails && !hasPlatforms) {
      warnings.push("Guardrails should be used with platforms");
    }

    setCompatibilityWarnings(warnings);
  }, [customizedItems]);

  const calculateTotalPrice = (items: CustomizedBundleItem[]) => {
    // Calculate the price of the customized items
    const customizedItemsPrice = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Apply a small discount for bundling (10%)
    const bundleDiscount = customizedItemsPrice * 0.1;
    const adjustedPrice = customizedItemsPrice - bundleDiscount;

    setTotalPrice(adjustedPrice > 0 ? adjustedPrice : 0);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    const item = customizedItems.find((i) => i.id === itemId);

    if (!item) return;

    // Ensure quantity is within allowed limits
    if (newQuantity < item.minQuantity) newQuantity = item.minQuantity;
    if (newQuantity > item.maxQuantity) newQuantity = item.maxQuantity;

    const updatedItems = customizedItems.map((i) =>
      i.id === itemId ? { ...i, quantity: newQuantity } : i
    );

    setCustomizedItems(updatedItems);
    calculateTotalPrice(updatedItems);
  };

  const handleOptionChange = (
    itemId: number,
    optionName: string,
    optionValue: string
  ) => {
    const updatedItems = customizedItems.map((item) => {
      if (item.id === itemId) {
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

    setCustomizedItems(updatedItems);
  };

  const handleAddToCart = () => {
    // Filter out items with quantity 0
    const finalItems = customizedItems.filter((item) => item.quantity > 0);

    // Update the product price to match our calculated total
    const updatedProduct = {
      ...product,
      price: totalPrice,
    };

    onAddToCart(updatedProduct, finalItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Scaffolding Bundle</DialogTitle>
          <DialogDescription>
            Configure quantities and options for the scaffolding components in
            this bundle
          </DialogDescription>
        </DialogHeader>

        {compatibilityWarnings.length > 0 && (
          <Alert variant="warning" className="mb-4">
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

        <div className="flex-1 overflow-hidden">
          {/* Bundle Components */}
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="font-medium mb-2">Bundle Components</h3>
            <ScrollArea className="flex-1 border rounded-md p-2">
              <div className="space-y-4 pr-4">
                {customizedItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No components in this bundle.
                  </div>
                ) : (
                  customizedItems
                    .filter((item) => !item.optional || item.quantity > 0)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="space-y-3 pb-3 border-b last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={
                                item.image ||
                                "/placeholder.svg?height=64&width=64"
                              }
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">
                                  {item.name}
                                </h4>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.price)} per unit
                            </p>

                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Label className="text-xs">Quantity</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          Min: {item.minQuantity}, Max:{" "}
                                          {item.maxQuantity}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>

                                <div className="flex items-center border rounded-md">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-none"
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    disabled={item.quantity <= item.minQuantity}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-7 text-center text-sm">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-none"
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    disabled={item.quantity >= item.maxQuantity}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 items-center pt-4 border-t mt-4">
          <div className="text-lg font-bold mr-auto">
            Total: {formatCurrency(totalPrice)}
            <span className="text-xs text-muted-foreground ml-2">
              (10% bundle discount applied)
            </span>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
