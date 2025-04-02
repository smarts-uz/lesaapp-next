import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart } from "lucide-react";
import type { CartItem, CustomizedBundleItem, Product } from "@/types/pos";
import { CartItem as CartItemComponent } from "@/components/pos/cart-item";
import { CartSummary } from "@/components/pos/cart-summary";

interface POSCartSectionProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  onRemove: (index: number) => void;
  onToggleBundleItems: (index: number) => void;
  onToggleBundleEditor: (index: number) => void;
  onUpdateBundleItemQuantity: (cartIndex: number, bundleItemId: number, newQuantity: number) => void;
  onUpdateBundleItemOption: (cartIndex: number, bundleItemId: number, optionName: string, optionValue: string) => void;
  onCloseBundleEditor: () => void;
  expandedBundleItems: Record<string, boolean>;
  editingBundleInCart: { index: number; open: boolean };
  subtotal: number;
  onCheckout: () => void;
}

export function POSCartSection({
  cart,
  onUpdateQuantity,
  onRemove,
  onToggleBundleItems,
  onToggleBundleEditor,
  onUpdateBundleItemQuantity,
  onUpdateBundleItemOption,
  onCloseBundleEditor,
  expandedBundleItems,
  editingBundleInCart,
  subtotal,
  onCheckout
}: POSCartSectionProps) {
  return (
    <div className="w-1/3 h-full flex flex-col border rounded-lg bg-background">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Current Order
        </h2>
      </div>

      {cart.length > 0 ? (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {cart.map((item, index) => (
                <CartItemComponent
                  key={`${item.id}-${index}`}
                  item={item}
                  index={index}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                  onToggleBundleItems={onToggleBundleItems}
                  onToggleBundleEditor={onToggleBundleEditor}
                  onUpdateBundleItemQuantity={onUpdateBundleItemQuantity}
                  onUpdateBundleItemOption={onUpdateBundleItemOption}
                  onCloseBundleEditor={onCloseBundleEditor}
                  isExpanded={expandedBundleItems[index]}
                  isEditing={
                    editingBundleInCart.index === index &&
                    editingBundleInCart.open
                  }
                />
              ))}
            </div>
          </ScrollArea>

          <CartSummary
            subtotal={subtotal}
            onCheckout={onCheckout}
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Your cart is empty</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Add scaffolding products by clicking on them in the product grid
          </p>
        </div>
      )}
    </div>
  );
} 