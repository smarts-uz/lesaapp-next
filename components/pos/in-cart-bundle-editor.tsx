"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Info, X } from "lucide-react"
import Image from "next/image"
import type { CartItem } from "@/types/pos"
import { formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InCartBundleEditorProps {
  bundle: CartItem
  onUpdateQuantity: (bundleItemId: number, quantity: number) => void
  onUpdateOption: (bundleItemId: number, optionName: string, optionValue: string) => void
  onClose: () => void
}

export function InCartBundleEditor({ bundle, onUpdateQuantity, onUpdateOption, onClose }: InCartBundleEditorProps) {
  return (
    <div className="border rounded-md p-3 bg-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Adjust Scaffolding Components</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Current bundle items */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">Bundle Components</h4>
        <ScrollArea className="h-[200px] pr-3 -mr-3">
          {bundle.bundleItems?.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1.5 group">
              <div className="h-8 w-8 relative rounded overflow-hidden flex-shrink-0">
                <Image
                  src={item.image || "/placeholder.svg?height=32&width=32"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{item.name}</span>
                  {item.optional && (
                    <Badge variant="outline" className="text-[10px] h-4">
                      Optional
                    </Badge>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center border rounded-md h-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-none"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= item.minQuantity}
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </Button>
                    <span className="w-5 text-center text-xs">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-none"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{formatCurrency(item.price)}</span>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Min: {item.minQuantity}, Max: {item.maxQuantity}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Options for selected item */}
      {bundle.bundleItems?.some((item) => item.variations && item.variations.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Component Options</h4>
          <ScrollArea className="h-[150px] pr-3 -mr-3">
            {bundle.bundleItems
              ?.filter((item) => item.quantity > 0 && item.variations && item.variations.length > 0)
              .map((item) => (
                <div key={`options-${item.id}`} className="mb-2">
                  <p className="text-xs font-medium mb-1">{item.name}</p>
                  <div className="space-y-1.5">
                    {item.variations?.map((variation) => (
                      <div key={`${item.id}-${variation.id}`} className="grid grid-cols-3 gap-1 items-center">
                        <Label className="text-xs">{variation.name}</Label>
                        <div className="col-span-2">
                          <Select
                            value={item.selectedOptions?.[variation.name] || variation.options[0]}
                            onValueChange={(value) => onUpdateOption(item.id, variation.name, value)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {variation.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </ScrollArea>
        </div>
      )}

      <div className="pt-2">
        <Button size="sm" className="w-full" onClick={onClose}>
          Apply Changes
        </Button>
      </div>
    </div>
  )
}

