"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tag, Banknote, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CartSummaryProps {
  subtotal: number
  onCheckout: () => void
}

export function CartSummary({ subtotal, onCheckout }: CartSummaryProps) {
  return (
    <div className="p-4 border-t">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <Button variant="outline" className="w-full">
          <Tag className="mr-2 h-4 w-4" />
          Discount
        </Button>
        <Button variant="outline" className="w-full">
          <Banknote className="mr-2 h-4 w-4" />
          Cash
        </Button>
      </div>
      
      <Button onClick={onCheckout} className="w-full">
        <CreditCard className="mr-2 h-4 w-4" />
        Checkout
      </Button>
    </div>
  )
} 