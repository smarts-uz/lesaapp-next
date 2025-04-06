"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Printer,
  Package,
  AlertCircle,
  Receipt,
  Plus,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { RefundDialog } from "@/components/dashboard/refund-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { fetchOrder } from "@/lib/woocommerce";
import type { Order, Refund, OrderItem, OrderBundleItem } from "@/types/pos";
import { format } from "date-fns";
import React from "react";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { useSearchParams, useRouter } from "next/navigation";

// Define a simplified order summary type
interface OrderSummary {
  id: string;
  number: string;
  date: string;
  customer: string;
  status: string;
  total: number;
}

// Create a separate component that uses useSearchParams
function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(orderId ? "details" : "list");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders list
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const response = await fetch("/api/order");
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch order details if orderId is present
  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async (id: string) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/order/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = await response.json();
        setOrderDetails(data);
      } catch (error) {
        console.error("Error loading order:", error);
        setError("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder(orderId);
  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "refunded":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleOrderClick = (id: string) => {
    router.push(`/dashboard/orders?id=${id}`);
  };

  const handleBackToList = () => {
    router.push("/dashboard/orders");
  };

  // Loading state for order details
  if (orderId && isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
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
    );
  }

  // Order not found state
  if (orderId && !orderDetails) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Order Not Found
            </h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            The order you are looking for could not be found. Please check the
            order ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Orders List</TabsTrigger>
          <TabsTrigger value="details" disabled={!orderId}>
            Order Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>View and manage your orders</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <OrdersTable
                  initialOrders={orders}
                  onOrderClick={handleOrderClick}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : orderDetails ? (
            <div>
              <div className="flex items-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToList}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
                </Button>
                <h2 className="text-2xl font-bold">
                  Order {orderDetails.number}
                </h2>
                <Badge
                  className={`ml-2 ${getStatusColor(orderDetails.status)}`}
                >
                  {orderDetails.status}
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>
                      Order information and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Order Number
                        </dt>
                        <dd>{orderDetails.number}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Date
                        </dt>
                        <dd>{new Date(orderDetails.date).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Payment Method
                        </dt>
                        <dd>{orderDetails.payment.method}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Transaction ID
                        </dt>
                        <dd className="truncate">
                          {orderDetails.payment.transaction}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                    <CardDescription>
                      Customer contact and shipping details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Contact
                        </h3>
                        <p className="font-medium">
                          {orderDetails.customer.name}
                        </p>
                        <p>{orderDetails.customer.email}</p>
                        <p>{orderDetails.customer.phone}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Billing Address
                          </h3>
                          <p>{orderDetails.billing.address}</p>
                          <p>
                            {orderDetails.billing.city},{" "}
                            {orderDetails.billing.state}{" "}
                            {orderDetails.billing.postcode}
                          </p>
                          <p>{orderDetails.billing.country}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Shipping Address
                          </h3>
                          <p>{orderDetails.shipping.address}</p>
                          <p>
                            {orderDetails.shipping.city},{" "}
                            {orderDetails.shipping.state}{" "}
                            {orderDetails.shipping.postcode}
                          </p>
                          <p>{orderDetails.shipping.country}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>
                    Scaffolding components and safety equipment in this order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3.5 text-left text-sm font-semibold">
                            Product
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-semibold">
                            SKU
                          </th>
                          <th className="px-4 py-3.5 text-right text-sm font-semibold">
                            Price
                          </th>
                          <th className="px-4 py-3.5 text-right text-sm font-semibold">
                            Quantity
                          </th>
                          <th className="px-4 py-3.5 text-right text-sm font-semibold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orderDetails.items.map((item: OrderItem) => (
                          <React.Fragment key={item.id}>
                            <tr>
                              <td className="whitespace-nowrap px-4 py-4">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <div className="flex items-center gap-1 font-medium">
                                      {item.name}
                                      {item.type === "bundle" && (
                                        <Package className="h-4 w-4 text-blue-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-sm">
                                {item.sku}
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-sm text-right">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-sm text-right">
                                {item.quantity}
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-sm text-right font-medium">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                            {item.type === "bundle" &&
                              item.bundleItems &&
                              item.bundleItems.map(
                                (bundleItem: OrderBundleItem) => (
                                  <tr
                                    key={`${item.id}-${bundleItem.id}`}
                                    className="bg-muted/20"
                                  >
                                    <td
                                      className="px-4 py-2 pl-8 text-sm"
                                      colSpan={2}
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {bundleItem.name}
                                        </div>
                                        {bundleItem.selectedOptions &&
                                          (
                                            Object.entries(
                                              bundleItem.selectedOptions,
                                            ) as [string, string][]
                                          ).map(([key, value]) => (
                                            <div
                                              key={key}
                                              className="text-xs text-muted-foreground mt-1"
                                            >
                                              <span className="mr-2">
                                                {key}:{" "}
                                                <span className="font-medium">
                                                  {value}
                                                </span>
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                      {formatCurrency(bundleItem.price)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                      {bundleItem.quantity}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-right">
                                      {formatCurrency(bundleItem.total)}
                                    </td>
                                  </tr>
                                ),
                              )}
                          </React.Fragment>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="px-4 py-3.5"></td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium">
                            Subtotal
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium">
                            {formatCurrency(orderDetails.subtotal)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-3.5"></td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium">
                            Shipping
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium">
                            {formatCurrency(orderDetails.shipping_total)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-3.5"></td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium">
                            Tax
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-medium">
                            {formatCurrency(orderDetails.tax_total)}
                          </td>
                        </tr>
                        {orderDetails.discount_total > 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-3.5"></td>
                            <td className="px-4 py-3.5 text-right text-sm font-medium">
                              Discount
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm font-medium text-red-500">
                              -{formatCurrency(orderDetails.discount_total)}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t-2">
                          <td colSpan={3} className="px-4 py-3.5"></td>
                          <td className="px-4 py-3.5 text-right text-base font-bold">
                            Total
                          </td>
                          <td className="px-4 py-3.5 text-right text-base font-bold">
                            {formatCurrency(orderDetails.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Refund History</CardTitle>
                  <CardDescription>
                    View all refunds processed for this order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orderDetails.refunds && orderDetails.refunds.length > 0 ? (
                    <div className="space-y-6">
                      {orderDetails.refunds.map((refund) => (
                        <div key={refund.id} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-medium flex items-center">
                                <Receipt className="mr-2 h-4 w-4" />
                                Refund #{refund.id}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(refund.date), "PPP 'at' p")}
                              </p>
                            </div>
                            <Badge className="bg-red-500">
                              {formatCurrency(refund.amount)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Reason
                              </h4>
                              <p>{refund.reason}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Payment Method
                              </h4>
                              <p>
                                {refund.payment_method === "original"
                                  ? "Original Payment Method"
                                  : refund.payment_method}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Transaction ID
                              </h4>
                              <p className="truncate">
                                {refund.transaction_id}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Processed By
                              </h4>
                              <p>{refund.created_by}</p>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <h4 className="text-sm font-medium mb-2">
                            Refunded Items
                          </h4>
                          <ul className="space-y-2">
                            {refund.items.map((item) => {
                              const originalItem = orderDetails.items.find(
                                (i) => i.id === item.id,
                              );
                              return (
                                <li key={item.id} className="flex items-center">
                                  <span className="mr-2">•</span>
                                  <span>
                                    {originalItem?.name || `Item #${item.id}`}
                                  </span>
                                  {item.type === "bundle" && (
                                    <Package className="ml-1 h-3 w-3 text-blue-500" />
                                  )}
                                </li>
                              );
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
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Order Selected</AlertTitle>
              <AlertDescription>
                Please select an order from the list.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main component with Suspense boundary
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
