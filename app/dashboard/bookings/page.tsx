import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { BookingsTable } from "@/components/dashboard/bookings-table"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function BookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/bookings/new">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Bookings</CardTitle>
                  <CardDescription>View and manage upcoming bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingsTable status="upcoming" />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Past Bookings</CardTitle>
                  <CardDescription>View past bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingsTable status="past" />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="cancelled" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cancelled Bookings</CardTitle>
                  <CardDescription>View cancelled bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingsTable status="cancelled" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View bookings by date</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" className="rounded-md border" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

