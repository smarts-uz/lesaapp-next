"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

export function NewDiscountForm() {
  const [name, setName] = useState("")
  const [type, setType] = useState("percentage")
  const [value, setValue] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [productType, setProductType] = useState("all")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !type || !value || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (startDate > endDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      })
      return
    }

    // In a real implementation, this would create a discount in WooCommerce
    toast({
      title: "Discount created",
      description: `${name} discount has been created`,
    })

    // Reset form
    setName("")
    setType("percentage")
    setValue("")
    setStartDate(undefined)
    setEndDate(undefined)
    setProductType("all")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Discount Name</Label>
        <Input id="name" placeholder="e.g. Summer Sale" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Discount Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
            <SelectItem value="free">Free (100% off)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type !== "free" && (
        <div className="space-y-2">
          <Label htmlFor="value">{type === "percentage" ? "Percentage Value" : "Amount"}</Label>
          <div className="relative">
            {type === "fixed" && <span className="absolute left-3 top-2.5">$</span>}
            <Input
              id="value"
              type="number"
              placeholder={type === "percentage" ? "e.g. 20" : "e.g. 10.00"}
              className={type === "fixed" ? "pl-7" : ""}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {type === "percentage" && <span className="absolute right-3 top-2.5">%</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productType">Apply To</Label>
        <Select value={productType} onValueChange={setProductType}>
          <SelectTrigger id="productType">
            <SelectValue placeholder="Select products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="services">Services Only</SelectItem>
            <SelectItem value="physical">Physical Products Only</SelectItem>
            <SelectItem value="bundles">Bundles Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        Create Discount
      </Button>
    </form>
  )
}

