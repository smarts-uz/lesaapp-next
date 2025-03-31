"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Printer, Package, AlertCircle, Receipt } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { RefundDialog } from "@/components/dashboard/refund-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { fetchOrder } from "@/lib/woocommerce"
import type { Order, Refund } from "@/types/pos"
import { format } from "date-fns"

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await fetchOrder(resolvedParams.id)
        setOrder(data)
      } catch (error) {
        console.error("Failed to fetch order:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [resolvedParams.id])

  const handleRefundComplete = (refundData: Refund) => {
    if (order) {
      // Add the new refund to the order's refunds array
      const updatedOrder = {
        ...order,
        refunds: [...(order.refunds || []), refundData],
        // If it's a full refund, update the order status
        status: refundData.refund_type === "full" ? "refunded" : order.status,
      }
      setOrder(updatedOrder)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "processing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "refunded":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Order Not Found</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            The order you are looking for could not be found. Please check the order ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Order {order.number}</h1>
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          {order.status !== "refunded" && (
            <RefundDialog
              orderId={order.id}
              orderNumber={order.number}
              items={order.items}
              onRefundComplete={handleRefundComplete}
            />
          )}
        </div>
      </div>

      {order.compatibility_warnings && order.compatibility_warnings.length > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Compatibility Warning</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2">
              {order.compatibility_warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="refunds">
            Refunds {order.refunds && order.refunds.length > 0 && `(${order.refunds.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Order information and status</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Order Number</dt>
                    <dd>{order.number}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Date</dt>
                    <dd>{new Date(order.date).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Payment Method</dt>
                    <dd>{order.payment.method}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Transaction ID</dt>
                    <dd className="truncate">{order.payment.transaction}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Customer contact and shipping details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                    <p className="font-medium">{order.customer.name}</p>
                    <p>{order.customer.email}</p>
                    <p>{order.customer.phone}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Billing Address</h3>
                      <p>{order.billing.address}</p>
                      <p>
                        {order.billing.city}, {order.billing.state} {order.billing.postcode}
                      </p>
                      <p>{order.billing.country}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Shipping Address</h3>
                      <p>{order.shipping.address}</p>
                      <p>
                        {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
                      </p>
                      <p>{order.shipping.country}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Scaffolding components and safety equipment in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">Product</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold">SKU</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold">Price</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold">Quantity</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((item) => (
                      <>
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="flex items-center gap-1 font-medium">
                                  {item.name}
                                  {item.type === "bundle" && <Package className="h-4 w-4 text-blue-500" />}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{item.sku}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-right">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-right">{item.quantity}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-right font-medium">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>

                        {/* Bundle items details */}
                        {item.type === "bundle" &&
                          item.bundleItems &&
                          item.bundleItems.map((bundleItem) => (
                            <tr key={`${item.id}-${bundleItem.id}`} className="bg-muted/20">
                              <td className="px-4 py-2 pl-8 text-sm" colSpan={2}>
                                <div>
                                  <div className="font-medium">{bundleItem.name}</div>
                                  {bundleItem.selectedOptions &&
                                    Object.entries(bundleItem.selectedOptions).length > 0 && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {Object.entries(bundleItem.selectedOptions).map(([key, value]) => (
                                          <span key={key} className="mr-2">
                                            {key}: <span className="font-medium">{value}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm text-right">{formatCurrency(bundleItem.price)}</td>
                              <td className="px-4 py-2 text-sm text-right">{bundleItem.quantity}</td>
                              <td className="px-4 py-2 text-sm text-right">{formatCurrency(bundleItem.total)}</td>
                            </tr>
                          ))}
                      </>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-4 py-3.5"></td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium">Subtotal</td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium">{formatCurrency(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-3.5"></td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium">Shipping</td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium">
                        {formatCurrency(order.shipping_total)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-3.5"></td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium">Tax</td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium">{formatCurrency(order.tax_total)}</td>
                    </tr>
                    {order.discount_total > 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-3.5"></td>
                        <td className="px-4 py-3.5 text-right text-sm font-medium">Discount</td>
                        <td className="px-4 py-3.5 text-right text-sm font-medium text-red-500">
                          -{formatCurrency(order.discount_total)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2">
                      <td colSpan={3} className="px-4 py-3.5"></td>
                      <td className="px-4 py-3.5 text-right text-base font-bold">Total</td>
                      <td className="px-4 py-3.5 text-right text-base font-bold">{formatCurrency(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Refund History</CardTitle>
              <CardDescription>View all refunds processed for this order</CardDescription>
            </CardHeader>
            <CardContent>
              {order.refunds && order.refunds.length > 0 ? (
                <div className="space-y-6">
                  {order.refunds.map((refund) => (
                    <div key={refund.id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium flex items-center">
                            <Receipt className="mr-2 h-4 w-4" />
                            Refund #{refund.id}
                          </h3>
                          <p className="text-sm text-muted-foreground">{format(new Date(refund.date), "PPP 'at' p")}</p>
                        </div>
                        <Badge className="bg-red-500">{formatCurrency(refund.amount)}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Reason</h4>
                          <p>{refund.reason}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                          <p>
                            {refund.payment_method === "original" ? "Original Payment Method" : refund.payment_method}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Transaction ID</h4>
                          <p className="truncate">{refund.transaction_id}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Processed By</h4>
                          <p>{refund.created_by}</p>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <h4 className="text-sm font-medium mb-2">Refunded Items</h4>
                      <ul className="space-y-2">
                        {refund.items.map((item) => {
                          const originalItem = order.items.find((i) => i.id === item.id)
                          return (
                            <li key={item.id} className="flex items-center">
                              <span className="mr-2">•</span>
                              <span>{originalItem?.name || `Item #${item.id}`}</span>
                              {item.type === "bundle" && <Package className="ml-1 h-3 w-3 text-blue-500" />}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No Refunds</h3>
                  <p>This order has not been refunded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

