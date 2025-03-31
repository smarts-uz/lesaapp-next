"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, RefreshCcw, Package, AlertCircle } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import type { OrderItem } from "@/types/pos"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { processRefund } from "@/lib/woocommerce"

interface RefundDialogProps {
  orderId: string
  orderNumber: string
  items: OrderItem[]
  onRefundComplete: (refundData: any) => void
}

export function RefundDialog({ orderId, orderNumber, items, onRefundComplete }: RefundDialogProps) {
  const [open, setOpen] = useState(false)
  const [refundDate, setRefundDate] = useState<Date>(new Date())
  const [reason, setReason] = useState("")
  const [selectedItems, setSelectedItems] = useState<{ id: number; type?: string; bundleItemIds?: number[] }[]>([])
  const [refundAmount, setRefundAmount] = useState("")
  const [refundType, setRefundType] = useState<"partial" | "full">("partial")
  const [restockItems, setRestockItems] = useState(true)
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"original" | "cash" | "card">("original")
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize refund amount when selected items change
  useEffect(() => {
    if (selectedItems.length > 0) {
      setRefundAmount(calculateSelectedTotal().toFixed(2))
    } else {
      setRefundAmount("")
    }
  }, [selectedItems])

  const handleItemToggle = (itemId: number, checked: boolean, type?: string) => {
    setSelectedItems((prev) => {
      if (checked) {
        // If it's a bundle, we add the bundle itself but not its items yet
        return [...prev, { id: itemId, type }]
      } else {
        // If unchecking, remove the item and any bundle items if it's a bundle
        return prev.filter((item) => item.id !== itemId)
      }
    })

    // Check for compatibility warnings
    checkCompatibilityWarnings(itemId, checked, type)
  }

  const handleBundleItemToggle = (bundleId: number, bundleItemId: number, checked: boolean) => {
    setSelectedItems((prev) => {
      const bundleIndex = prev.findIndex((item) => item.id === bundleId)

      if (bundleIndex === -1) return prev

      const updatedItems = [...prev]
      const bundle = updatedItems[bundleIndex]

      if (!bundle.bundleItemIds) {
        bundle.bundleItemIds = []
      }

      if (checked) {
        bundle.bundleItemIds.push(bundleItemId)
      } else {
        bundle.bundleItemIds = bundle.bundleItemIds.filter((id) => id !== bundleItemId)
      }

      return updatedItems
    })
  }

  const checkCompatibilityWarnings = (itemId: number, checked: boolean, type?: string) => {
    // Only check when removing items
    if (checked) {
      setCompatibilityWarnings([])
      return
    }

    const warnings: string[] = []

    // Find the item being toggled
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    // Check if this is a bundle with frames
    if (type === "bundle" && item.bundleItems) {
      const hasFrames = item.bundleItems.some((bi) => bi.name.toLowerCase().includes("frame"))
      const hasBraces = item.bundleItems.some((bi) => bi.name.toLowerCase().includes("brace"))

      if (hasFrames && hasBraces) {
        warnings.push(
          "Refunding this bundle will remove both frames and braces that may be needed for other scaffolding",
        )
      }
    }

    // Check if this is a simple frame or brace
    if (type !== "bundle") {
      if (item.name.toLowerCase().includes("frame")) {
        warnings.push("Refunding scaffold frames may affect the stability of your remaining scaffolding")
      }

      if (item.name.toLowerCase().includes("brace")) {
        warnings.push("Refunding cross braces may affect the stability of your remaining scaffolding")
      }
    }

    setCompatibilityWarnings(warnings)
  }

  const calculateSelectedTotal = () => {
    let total = 0

    for (const selectedItem of selectedItems) {
      const item = items.find((i) => i.id === selectedItem.id)
      if (!item) continue

      if (
        item.type === "bundle" &&
        selectedItem.bundleItemIds &&
        selectedItem.bundleItemIds.length > 0 &&
        item.bundleItems
      ) {
        // For bundles, calculate based on selected bundle items
        for (const bundleItemId of selectedItem.bundleItemIds) {
          const bundleItem = item.bundleItems.find((bi) => bi.id === bundleItemId)
          if (bundleItem) {
            total += bundleItem.total
          }
        }
      } else {
        // For simple items or entire bundles
        total += item.total
      }
    }

    return total
  }

  const handleFullRefund = () => {
    setRefundType("full")

    // Select all items
    const allItems = items.map((item) => ({
      id: item.id,
      type: item.type,
    }))

    setSelectedItems(allItems)

    // Set refund amount to total of all items
    const total = items.reduce((sum, item) => sum + item.total, 0)
    setRefundAmount(total.toFixed(2))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to refund",
        variant: "destructive",
      })
      return
    }

    if (!reason) {
      toast({
        title: "Error",
        description: "Please provide a reason for the refund",
        variant: "destructive",
      })
      return
    }

    if (!refundAmount) {
      toast({
        title: "Error",
        description: "Please enter a refund amount",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Prepare refund data
      const refundData = {
        order_id: orderId,
        order_number: orderNumber,
        amount: Number.parseFloat(refundAmount),
        date: refundDate.toISOString(),
        reason: reason,
        items: selectedItems.map((item) => {
          const originalItem = items.find((i) => i.id === item.id)
          return {
            id: item.id,
            name: originalItem?.name || "",
            type: item.type,
            bundleItemIds: item.bundleItemIds,
            refunded: true,
          }
        }),
        restock: restockItems,
        payment_method: paymentMethod,
        refund_type: refundType,
      }

      // Process the refund
      const result = await processRefund(orderId, refundData)

      // Notify parent component about the refund
      onRefundComplete(result)

      toast({
        title: "Refund processed",
        description: `Refund of ${formatCurrency(Number.parseFloat(refundAmount))} has been processed`,
      })

      setOpen(false)

      // Reset form
      setRefundDate(new Date())
      setReason("")
      setSelectedItems([])
      setRefundAmount("")
      setRefundType("partial")
      setRestockItems(true)
      setCompatibilityWarnings([])
      setPaymentMethod("original")
    } catch (error) {
      console.error("Refund processing error:", error)
      toast({
        title: "Refund failed",
        description: "There was an error processing the refund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Process Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Process Scaffolding Refund</DialogTitle>
            <DialogDescription>Select scaffolding components to refund and provide refund details</DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="partial"
            className="mt-4"
            onValueChange={(value) => setRefundType(value as "partial" | "full")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="partial">Partial Refund</TabsTrigger>
              <TabsTrigger value="full">Full Refund</TabsTrigger>
            </TabsList>

            <TabsContent value="partial" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Refund Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !refundDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {refundDate ? format(refundDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={refundDate} onSelect={setRefundDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Refund Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for the refund"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Items to Refund</Label>
                <div className="rounded-md border p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={selectedItems.some((si) => si.id === item.id)}
                          onCheckedChange={(checked) => handleItemToggle(item.id, checked as boolean, item.type)}
                          disabled={!item.refundable}
                        />
                        <Label
                          htmlFor={`item-${item.id}`}
                          className={cn(
                            "flex flex-1 justify-between items-center",
                            !item.refundable && "text-muted-foreground",
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span>
                              {item.name} x {item.quantity}
                              {!item.refundable && " (non-refundable)"}
                            </span>
                            {item.type === "bundle" && <Package className="h-4 w-4 text-blue-500" />}
                          </div>
                          <span>{formatCurrency(item.total)}</span>
                        </Label>
                      </div>

                      {/* Bundle items selection */}
                      {item.type === "bundle" &&
                        item.bundleItems &&
                        item.bundleItems.length > 0 &&
                        selectedItems.some((si) => si.id === item.id) && (
                          <div className="pl-8 space-y-2 border-l-2 ml-3">
                            <div className="text-sm font-medium text-muted-foreground">Scaffolding Components:</div>
                            {item.bundleItems.map((bundleItem) => (
                              <div key={bundleItem.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`bundle-item-${item.id}-${bundleItem.id}`}
                                  checked={selectedItems.some(
                                    (si) => si.id === item.id && si.bundleItemIds?.includes(bundleItem.id),
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleBundleItemToggle(item.id, bundleItem.id, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`bundle-item-${item.id}-${bundleItem.id}`}
                                  className="flex flex-1 justify-between"
                                >
                                  <div>
                                    <span>{bundleItem.name}</span>
                                    {bundleItem.selectedOptions &&
                                      Object.entries(bundleItem.selectedOptions).length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                          {Object.entries(bundleItem.selectedOptions).map(([key, value]) => (
                                            <span key={key} className="mr-2">
                                              {key}: <span className="font-medium">{value}</span>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                  <span>{formatCurrency(bundleItem.total)}</span>
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="refundAmount">Refund Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    Selected total: {formatCurrency(calculateSelectedTotal())}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Refund Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as "original" | "cash" | "card")}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select refund method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original Payment Method</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restock"
                  checked={restockItems}
                  onCheckedChange={(checked) => setRestockItems(!!checked)}
                />
                <Label htmlFor="restock">Restock items</Label>
              </div>
            </TabsContent>

            <TabsContent value="full" className="space-y-4 pt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Full Refund</AlertTitle>
                <AlertDescription>
                  This will refund the entire order amount and optionally restock all items.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Refund Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !refundDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {refundDate ? format(refundDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={refundDate} onSelect={setRefundDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason-full">Refund Reason</Label>
                <Textarea
                  id="reason-full"
                  placeholder="Enter the reason for the full refund"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod-full">Refund Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as "original" | "cash" | "card")}
                >
                  <SelectTrigger id="paymentMethod-full">
                    <SelectValue placeholder="Select refund method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original Payment Method</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restock-full"
                  checked={restockItems}
                  onCheckedChange={(checked) => setRestockItems(!!checked)}
                />
                <Label htmlFor="restock-full">Restock all items</Label>
              </div>

              <Button type="button" variant="secondary" className="w-full" onClick={handleFullRefund}>
                Calculate Full Refund
              </Button>

              <div className="p-4 border rounded-md bg-muted/50">
                <div className="flex justify-between font-medium">
                  <span>Total Refund Amount:</span>
                  <span>{refundAmount ? formatCurrency(Number(refundAmount)) : formatCurrency(0)}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {compatibilityWarnings.length > 0 && (
            <Alert variant="warning" className="mt-4">
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

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

