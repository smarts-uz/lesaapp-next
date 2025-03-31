import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency } from "@/lib/utils"

export function RecentSales() {
  return (
    <div className="space-y-8">
      {recentSales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={sale.avatar} alt={sale.name} />
            <AvatarFallback>{sale.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">{sale.email}</p>
          </div>
          <div className="ml-auto font-medium">{formatCurrency(sale.amount)}</div>
        </div>
      ))}
    </div>
  )
}

const recentSales = [
  {
    id: 1,
    name: "Olivia Martin",
    email: "olivia.martin@example.com",
    amount: 199.99,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    name: "Jackson Lee",
    email: "jackson.lee@example.com",
    amount: 39.99,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    name: "Isabella Nguyen",
    email: "isabella.nguyen@example.com",
    amount: 299.99,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 4,
    name: "William Kim",
    email: "will.kim@example.com",
    amount: 99.99,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 5,
    name: "Sofia Davis",
    email: "sofia.davis@example.com",
    amount: 149.99,
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

