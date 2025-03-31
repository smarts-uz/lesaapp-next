"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Printer, Download } from "lucide-react"
import type { Refund, Order } from "@/types/pos"
import { format } from "date-fns"
import { useReactToPrint } from "react-to-print"

interface RefundReceiptProps {
  refund: Refund
  order: Order
}

export function RefundReceipt({ refund, order }: RefundReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  })

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-6" ref={receiptRef}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Refund Receipt</h2>
            <p className="text-muted-foreground">ScaffoldPOS System</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Refund Information</h3>
              <p className="font-medium">Refund #{refund.id}</p>
              <p>Date: {format(new Date(refund.date), "PPP")}</p>
              <p>Time: {format(new Date(refund.date), "p")}</p>
              <p>Transaction: {refund.transaction_id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Order Information</h3>
              <p className="font-medium">{order.number}</p>
              <p>Date: {format(new Date(order.date), "PPP")}</p>
              <p>Customer: {order.customer.name}</p>
              <p>Email: {order.customer.email}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Refund Reason</h3>
            <p className="border p-2 rounded-md">{refund.reason}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Refunded Items</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {refund.items.map((item) => {
                  const originalItem = order.items.find((i) => i.id === item.id)
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{originalItem?.name || `Item #${item.id}`}</td>
                      <td className="text-right py-2">{originalItem ? formatCurrency(originalItem.total) : "-"}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-2 font-bold">Total Refund</td>
                  <td className="text-right py-2 font-bold">{formatCurrency(refund.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Information</h3>
            <p>
              Refund Method: {refund.payment_method === "original" ? "Original Payment Method" : refund.payment_method}
            </p>
            {refund.restock_items && <p>Items have been restocked to inventory</p>}
          </div>

          <div className="text-center text-sm text-muted-foreground mt-8 pt-4 border-t">
            <p>Thank you for your business!</p>
            <p>For any questions, please contact support@scaffoldpos.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

