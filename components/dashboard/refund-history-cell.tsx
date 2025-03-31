"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"
import { Receipt } from "lucide-react"
import type { Refund } from "@/types/pos"
import { format } from "date-fns"

interface RefundHistoryCellProps {
  refunds: Refund[]
}

export function RefundHistoryCell({ refunds }: RefundHistoryCellProps) {
  if (!refunds || refunds.length === 0) {
    return null
  }

  const totalRefunded = refunds.reduce((sum, refund) => sum + refund.amount, 0)

  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        {formatCurrency(totalRefunded)} refunded
      </Badge>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Receipt className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Refund History</h4>
              <div className="space-y-1 text-xs">
                {refunds.map((refund) => (
                  <div key={refund.id} className="flex justify-between">
                    <span>
                      {(() => {
                        try {
                          const dateObj = new Date(refund.date)
                          // Check if date is valid
                          if (isNaN(dateObj.getTime())) {
                            return "Invalid date"
                          }
                          return format(dateObj, "MMM d, yyyy")
                        } catch (error) {
                          return "Invalid date"
                        }
                      })()} - #{refund.id}
                    </span>
                    <span className="font-medium">{formatCurrency(refund.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

