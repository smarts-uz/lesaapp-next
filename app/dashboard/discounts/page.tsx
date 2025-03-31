import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscountsTable } from "@/components/dashboard/discounts-table"
import { Plus } from "lucide-react"
import Link from "next/link"
import { NewDiscountForm } from "@/components/dashboard/new-discount-form"

export default function DiscountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Discounts</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/discounts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Discount
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Discounts</CardTitle>
              <CardDescription>View and manage your active discount periods</CardDescription>
            </CardHeader>
            <CardContent>
              <DiscountsTable />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Discount</CardTitle>
              <CardDescription>Create a new time-based discount</CardDescription>
            </CardHeader>
            <CardContent>
              <NewDiscountForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

