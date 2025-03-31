"use client"

import { useState } from "react"
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
import { RefreshCcw, Search } from "lucide-react"
import { fetchOrder } from "@/lib/woocommerce"
import type { Order } from "@/types/pos"

interface RefundButtonProps {
  onRefundProcessed?: () => void
}

export function RefundButton({ onRefundProcessed }: RefundButtonProps) {
  const [open, setOpen] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")

  const handleSearch = async () => {
    if (!orderNumber) {
      setSearchError("Please enter an order number")
      return
    }

    setIsSearching(true)
    setSearchError("")

    try {
      // Extract the order ID from the order number (e.g., #ORD-123 -> 123)
      const orderId = orderNumber.replace(/[^\d]/g, "")
      const orderData = await fetchOrder(orderId)

      if (orderData) {
        setOrder(orderData)
      } else {
        setSearchError("Order not found")
      }
    } catch (error) {
      console.error("Error searching for order:", error)
      setSearchError("Failed to search for order")
    } finally {
      setIsSearching(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when dialog closes
      setOrderNumber("")
      setOrder(null)
      setSearchError("")
    }
  }

  const handleViewOrder = () => {
    if (order) {
      // Navigate to order details page
      window.open(`/dashboard/orders/${order.id}`, "_blank")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Process Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>Enter an order number to search for and process a refund.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <div className="flex gap-2">
              <Input
                id="orderNumber"
                placeholder="#ORD-123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
              <Button type="button" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {searchError && <p className="text-sm text-red-500">{searchError}</p>}
          </div>

          {order && (
            <div className="border rounded-md p-4">
              <h3 className="font-medium">Order Found</h3>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number:</p>
                  <p>{order.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date:</p>
                  <p>{new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer:</p>
                  <p>{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total:</p>
                  <p>${order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {order && <Button onClick={handleViewOrder}>View Order Details</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

