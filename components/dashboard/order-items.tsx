"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import {
  fetchOrder,
  getOrderItems,
  getOrderBundleItems,
  getRefundableItems,
} from "@/lib/woocommerce";
import type { Order, OrderItem, OrderBundleItem } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";

interface OrderItemsProps {
  orderId: string;
}

export function OrderItems({ orderId }: OrderItemsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Loading order items...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Error loading order items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Order not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div>No order found with ID: {orderId}</div>
        </CardContent>
      </Card>
    );
  }

  // Get all items from the order
  const allItems = getOrderItems(order);

  // Get all bundle items from the order
  const allBundleItems = getOrderBundleItems(order);

  // Get all refundable items from the order
  const refundableItems = getRefundableItems(order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
        <CardDescription>
          Order #{order.number} - {allItems.length} items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">
              All Items ({allItems.length})
            </h3>
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
                  {allItems.map((item: OrderItem) => (
                    <tr key={item.id}>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {allBundleItems.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                Bundle Items ({allBundleItems.length})
              </h3>
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
                    {allBundleItems.map((item: OrderBundleItem) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="font-medium">{item.name}</div>
                              {item.selectedOptions &&
                                Object.entries(item.selectedOptions).map(
                                  ([key, value]) => (
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
                                  ),
                                )}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {refundableItems.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                Refundable Items ({refundableItems.length})
              </h3>
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
                    {refundableItems.map((item: OrderItem) => (
                      <tr key={item.id}>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
