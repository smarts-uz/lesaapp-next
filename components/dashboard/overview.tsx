"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Jan",
    sales: 4000,
    bookings: 2400,
  },
  {
    name: "Feb",
    sales: 3000,
    bookings: 1398,
  },
  {
    name: "Mar",
    sales: 9800,
    bookings: 2800,
  },
  {
    name: "Apr",
    sales: 3908,
    bookings: 2908,
  },
  {
    name: "May",
    sales: 4800,
    bookings: 2800,
  },
  {
    name: "Jun",
    sales: 3800,
    bookings: 2300,
  },
  {
    name: "Jul",
    sales: 4300,
    bookings: 2100,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Bar dataKey="sales" fill="#adfa1d" radius={[4, 4, 0, 0]} />
        <Bar dataKey="bookings" fill="#1e88e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

