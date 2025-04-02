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

interface POSOrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetails: any;
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
          <DialogTitle>Order #{orderDetails.id} Created</DialogTitle>
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
            {orderDetails.items.map((item: any, index: number) => (
              <div
                key={index}
                className="flex justify-between text-sm border-b pb-1"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
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