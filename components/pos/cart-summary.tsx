"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tag, Banknote, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface CartSummaryProps {
  subtotal: number
  onCheckout: () => void
  isLoading?: boolean
}

export function CartSummary({ subtotal, onCheckout, isLoading = false }: CartSummaryProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      await onCheckout()
    } catch (error) {
      console.error("Error during checkout:", error)
      toast({
        title: "Checkout Error",
        description: "There was a problem processing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-4 border-t">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>
      
      <Button 
        onClick={handleCheckout} 
        className="w-full"
        disabled={isLoading || isProcessing || subtotal <= 0}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {isLoading || isProcessing ? "Processing..." : "Checkout"}
      </Button>
    </div>
  )
} 