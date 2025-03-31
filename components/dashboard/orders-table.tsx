"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, Eye, RefreshCcw, Printer } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { RefundHistoryCell } from "@/components/dashboard/refund-history-cell"

interface OrdersTableProps {
  status?: string
}

export function OrdersTable({ status }: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10

  // Filter orders based on status and search query
  const filteredOrders = orders.filter((order) => {
    if (status && order.status !== status) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return order.number.toLowerCase().includes(query) || order.customer.toLowerCase().includes(query)
    }
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "processing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "refunded":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">
                      {order.number}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    {order.refunds && order.refunds.length > 0 && <RefundHistoryCell refunds={order.refunds} />}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Printer className="mr-2 h-4 w-4" />
                          Print order
                        </DropdownMenuItem>
                        {order.status !== "refunded" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/orders/${order.id}?tab=refunds`}>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Process refund
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No orders found.
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

const orders = [
  {
    id: "1",
    number: "#ORD-001",
    date: "2025-03-31T10:00:00",
    customer: "John Doe",
    status: "completed",
    total: 240.96,
    refunds: [
      {
        id: "RF-1",
        date: "2025-03-29T10:00:00",
        amount: 20,
        reason: "Customer request",
        payment_method: "original",
        transaction_id: "txn_refund_123456",
        status: "completed",
        created_by: "admin",
        restock_items: true,
        items: [],
        order_id: "1",
      },
      {
        id: "RF-2",
        date: "2025-03-30T14:30:00",
        amount: 30,
        reason: "Damaged item",
        payment_method: "original",
        transaction_id: "txn_refund_789012",
        status: "completed",
        created_by: "admin",
        restock_items: true,
        items: [],
        order_id: "1",
      },
    ],
  },
  {
    id: "2",
    number: "#ORD-002",
    date: "2025-03-30T14:30:00",
    customer: "Jane Smith",
    status: "processing",
    total: 125.5,
  },
  {
    id: "3",
    number: "#ORD-003",
    date: "2025-03-29T09:15:00",
    customer: "Robert Johnson",
    status: "pending",
    total: 75.2,
  },
  {
    id: "4",
    number: "#ORD-004",
    date: "2025-03-28T16:45:00",
    customer: "Emily Davis",
    status: "refunded",
    total: 199.99,
  },
  {
    id: "5",
    number: "#ORD-005",
    date: "2025-03-27T11:30:00",
    customer: "Michael Wilson",
    status: "completed",
    total: 349.95,
  },
  {
    id: "6",
    number: "#ORD-006",
    date: "2025-03-26T13:20:00",
    customer: "Sarah Brown",
    status: "processing",
    total: 89.99,
  },
  {
    id: "7",
    number: "#ORD-007",
    date: "2025-03-25T15:10:00",
    customer: "David Miller",
    status: "completed",
    total: 129.5,
  },
  {
    id: "8",
    number: "#ORD-008",
    date: "2025-03-24T10:45:00",
    customer: "Jennifer Taylor",
    status: "pending",
    total: 59.99,
  },
]

