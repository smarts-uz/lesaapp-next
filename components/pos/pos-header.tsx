import { RefundButton } from "@/components/pos/refund-button";

interface POSHeaderProps {
  title: string;
}

export function POSHeader({ title }: POSHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex gap-2">
        <RefundButton />
      </div>
    </div>
  );
}
