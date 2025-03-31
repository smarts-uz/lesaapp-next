"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function DiscountsTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const discountsPerPage = 10

  // Pagination
  const totalPages = Math.ceil(discounts.length / discountsPerPage)
  const paginatedDiscounts = discounts.slice((currentPage - 1) * discountsPerPage, currentPage * discountsPerPage)

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) {
      return <Badge className="bg-yellow-500">Scheduled</Badge>
    } else if (now > end) {
      return <Badge className="bg-gray-500">Expired</Badge>
    } else {
      return <Badge className="bg-green-500">Active</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDiscounts.length > 0 ? (
              paginatedDiscounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">{discount.name}</TableCell>
                  <TableCell>{discount.type}</TableCell>
                  <TableCell>{new Date(discount.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(discount.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {discount.type === "Percentage" ? `${discount.value}%` : formatCurrency(discount.value)}
                  </TableCell>
                  <TableCell>{getStatusBadge(discount.startDate, discount.endDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No discounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

const discounts = [
  {
    id: 1,
    name: "Spring Sale",
    type: "Percentage",
    startDate: "2025-03-20T00:00:00",
    endDate: "2025-04-20T23:59:59",
    value: 20,
    products: ["all"],
  },
  {
    id: 2,
    name: "New Customer Discount",
    type: "Fixed Amount",
    startDate: "2025-01-01T00:00:00",
    endDate: "2025-12-31T23:59:59",
    value: 10,
    products: ["all"],
  },
  {
    id: 3,
    name: "Weekend Special",
    type: "Percentage",
    startDate: "2025-04-05T00:00:00",
    endDate: "2025-04-06T23:59:59",
    value: 15,
    products: ["services"],
  },
  {
    id: 4,
    name: "Summer Preview",
    type: "Percentage",
    startDate: "2025-05-01T00:00:00",
    endDate: "2025-05-15T23:59:59",
    value: 25,
    products: ["seasonal"],
  },
  {
    id: 5,
    name: "Loyalty Reward",
    type: "Fixed Amount",
    startDate: "2025-01-01T00:00:00",
    endDate: "2025-12-31T23:59:59",
    value: 15,
    products: ["premium"],
  },
]

