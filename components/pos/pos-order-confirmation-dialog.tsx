import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  type?: string;
  bundleItems?: any[];
}

interface OrderDetails {
  id: string;
  number: string;
  date: string;
  status: string;
  payment_method: string;
  items: OrderItem[];
  subtotal: number;
  tax_total: number;
  total: number;
}

interface POSOrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetails: OrderDetails | null;
}

export function POSOrderConfirmationDialog({
  open,
  onOpenChange,
  orderDetails
}: POSOrderConfirmationDialogProps) {
  if (!orderDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order {orderDetails.number} Created</DialogTitle>
          <DialogDescription>
            Order details have been successfully saved
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-3 my-2">
          <div className="text-sm space-y-1">
            <p className="font-medium">
              Date: {new Date(orderDetails.date).toLocaleString()}
            </p>
            <p className="font-medium">Status: {orderDetails.status}</p>
            <p className="font-medium">
              Payment Method: {orderDetails.payment_method}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-3 my-2">
          <h4 className="font-semibold mb-2">Items</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {orderDetails.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between text-sm border-b pb-1"
              >
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium">{item.name}</p>
                    {item.type === "bundle" && <Package className="h-3 w-3 text-blue-500" />}
                  </div>
                  <p className="text-xs">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                  {item.type === "bundle" && item.bundleItems && item.bundleItems.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1 pl-2 border-l-2">
                      {item.bundleItems
                        .filter((bundleItem) => bundleItem.quantity > 0)
                        .map((bundleItem, idx) => (
                          <div key={idx}>
                            {bundleItem.name} x {bundleItem.quantity}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <p className="font-medium">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-3 my-2">
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(orderDetails.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(orderDetails.tax_total)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(orderDetails.total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 