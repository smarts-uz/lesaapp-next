"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({
  products,
  isLoading,
  onAddToCart,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted"></div>
              <div className="p-3">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
          onClick={() => onAddToCart(product)}
        >
          <CardContent className="p-0">
            <div className="aspect-square relative">
              <Image
                src={product.image || "/placeholder.svg?height=200&width=200"}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.onSale && (
                <Badge className="absolute top-2 right-2 bg-red-500">
                  Sale
                </Badge>
              )}
              {product.type === "bundle" && (
                <Badge className="absolute top-2 left-2 bg-blue-500">
                  Bundle
                </Badge>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1">
                <h3 className="font-medium line-clamp-1">{product.name}</h3>
                {product.type === "bundle" && (
                  <Package className="h-3 w-3 text-blue-500" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {product.stock} left
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
