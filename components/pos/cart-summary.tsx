"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Banknote, Tag } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CartSummaryProps {
  subtotal: number
  onCheckout: () => void
}

export function CartSummary({ subtotal, onCheckout }: CartSummaryProps) {
  const tax = subtotal * 0.1
  const total = subtotal + tax

  return (
    <div className="p-4 border-t">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
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
        <Button className="w-full" onClick={onCheckout}>
          <CreditCard className="mr-2 h-4 w-4" />
          Card
        </Button>
      </div>
    </div>
  )
} 