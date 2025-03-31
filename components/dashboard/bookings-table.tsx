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
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, Eye, Calendar, X } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface BookingsTableProps {
  status?: string
}

export function BookingsTable({ status }: BookingsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const bookingsPerPage = 10

  // Filter bookings based on status and search query
  const filteredBookings = bookings.filter((booking) => {
    if (status && booking.status !== status) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        booking.id.toLowerCase().includes(query) ||
        booking.customer.toLowerCase().includes(query) ||
        booking.service.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage)
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500"
      case "past":
        return "bg-green-500"
      case "cancelled":
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
            placeholder="Search bookings..."
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
              <TableHead>ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBookings.length > 0 ? (
              paginatedBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/bookings/${booking.id}`} className="hover:underline">
                      {booking.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">{booking.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>{booking.customer}</TableCell>
                  <TableCell>{booking.service}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(booking.price)}</TableCell>
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
                          <Link href={`/dashboard/bookings/${booking.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Reschedule
                        </DropdownMenuItem>
                        {booking.status !== "cancelled" && (
                          <DropdownMenuItem>
                            <X className="mr-2 h-4 w-4" />
                            Cancel booking
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No bookings found.
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

const bookings = [
  {
    id: "BK-001",
    date: "2025-04-05T00:00:00",
    time: "10:00 AM - 11:00 AM",
    customer: "John Doe",
    service: "Haircut",
    status: "upcoming",
    price: 35.0,
  },
  {
    id: "BK-002",
    date: "2025-04-06T00:00:00",
    time: "2:30 PM - 3:30 PM",
    customer: "Jane Smith",
    service: "Manicure & Pedicure",
    status: "upcoming",
    price: 65.0,
  },
  {
    id: "BK-003",
    date: "2025-03-30T00:00:00",
    time: "11:15 AM - 12:15 PM",
    customer: "Robert Johnson",
    service: "Massage Therapy",
    status: "past",
    price: 85.0,
  },
  {
    id: "BK-004",
    date: "2025-03-29T00:00:00",
    time: "3:00 PM - 4:30 PM",
    customer: "Emily Davis",
    service: "Full Spa Package",
    status: "cancelled",
    price: 150.0,
  },
  {
    id: "BK-005",
    date: "2025-04-10T00:00:00",
    time: "9:30 AM - 10:30 AM",
    customer: "Michael Wilson",
    service: "Beard Trim",
    status: "upcoming",
    price: 25.0,
  },
  {
    id: "BK-006",
    date: "2025-03-28T00:00:00",
    time: "1:00 PM - 2:00 PM",
    customer: "Sarah Brown",
    service: "Hair Coloring",
    status: "past",
    price: 120.0,
  },
]

