"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Package, Plus, Minus, Edit, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import Image from "next/image"
import type { CartItem } from "@/types/pos"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { QuantityControl } from "./bundle-customization-dialog"

const calculateItemTotal = (item: CartItem) => item.price * item.quantity;

interface CartItemProps {
  item: CartItem
  index: number
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemove: (index: number) => void
  onToggleBundleItems: (index: number) => void
  onToggleBundleEditor: (index: number) => void
  onUpdateBundleItemQuantity: (cartIndex: number, bundleItemId: number, quantity: number) => void
  onUpdateBundleItemOption: (cartIndex: number, bundleItemId: number, optionName: string, optionValue: string) => void
  onCloseBundleEditor: () => void
  isExpanded: boolean
  isEditing: boolean
}

export function CartItem({
  item,
  index,
  onUpdateQuantity,
  onRemove,
  onToggleBundleItems,
  onToggleBundleEditor,
  onUpdateBundleItemQuantity,
  onUpdateBundleItemOption,
  onCloseBundleEditor,
  isExpanded,
  isEditing,
}: CartItemProps) {
  return (
    <div className="space-y-3">
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
            <QuantityControl
              quantity={item.quantity}
              minQuantity={1}
              maxQuantity={999}
              onQuantityChange={(newQuantity) => {
                if (item.type === "bundle" && item.bundleItems) {
                  // Calculate the ratio of the new quantity to the current quantity
                  const ratio = newQuantity / item.quantity;
                  
                  // Update bundle items quantities proportionally
                  const updatedBundleItems = item.bundleItems.map(bundleItem => {
                    // Calculate the new quantity for this item
                    const newItemQuantity = Math.round(bundleItem.quantity * ratio);
                    
                    // Ensure the new quantity is within min/max limits
                    const validQuantity = Math.max(
                      bundleItem.minQuantity,
                      Math.min(newItemQuantity, bundleItem.maxQuantity)
                    );
                    
                    // Update bundle item quantity
                    onUpdateBundleItemQuantity(index, bundleItem.id, validQuantity);
                    
                    return {
                      ...bundleItem,
                      quantity: validQuantity
                    };
                  });
                }
                
                // Update main item quantity
                onUpdateQuantity(index, newQuantity);
              }}
              size="sm"
            />
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">{formatCurrency(item.price)}</span>
              <span className="text-sm">x{item.quantity}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {item.type === "bundle" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => onToggleBundleEditor(index)}
                title="Edit bundle quantities"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => onToggleBundleItems(index)}
                title={isExpanded ? "Collapse bundle items" : "Expand bundle items"}
              >
                {isExpanded ? (
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
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {item.type === "bundle" && item.bundleItems && item.bundleItems.length > 0 && (
        <Collapsible open={isExpanded}>
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

      {item.type === "bundle" && isEditing && (
        <div className="border rounded-lg p-4 mt-2 bg-muted/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Edit Bundle Components</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCloseBundleEditor}
              >
                Done
              </Button>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-4 pr-4">
                {item.bundleItems?.map((bundleItem) => (
                  <div key={bundleItem.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                    <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={bundleItem.image || "/placeholder.svg?height=64&width=64"}
                        alt={bundleItem.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{bundleItem.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">Bundle component</p>

                      <div className="mt-2">
                        <QuantityControl
                          quantity={bundleItem.quantity}
                          minQuantity={1}
                          maxQuantity={bundleItem.maxQuantity * item.quantity}
                          onQuantityChange={(newQuantity) => 
                            onUpdateBundleItemQuantity(index, bundleItem.id, newQuantity)
                          }
                          label="Quantity"
                          tooltipContent={`Min: ${bundleItem.minQuantity * item.quantity}, Max: ${bundleItem.maxQuantity * item.quantity}`}
                          size="sm"
                        />
                      </div>

                      {bundleItem.selectedOptions && 
                        Object.entries(bundleItem.selectedOptions).length > 0 && (
                          <div className="mt-2 space-y-2">
                            {Object.entries(bundleItem.selectedOptions).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <Label className="text-xs">{key}:</Label>
                                <span className="text-xs font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      <Separator />
    </div>
  )
} 