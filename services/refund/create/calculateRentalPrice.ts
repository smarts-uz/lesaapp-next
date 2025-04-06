/**
 * Calculates rental price based on used days and discount days
 */
export function calculateRentalPrice({
  startDateTime,
  endDateTime,
  discountDays,
  baseAmount,
}: {
  startDateTime: Date;
  endDateTime: Date;
  discountDays: number;
  baseAmount: number;
}): { usedDays: number; effectiveDays: number; rentalPrice: number } {
  if (!startDateTime) {
    throw new Error("Start date is required for rental calculations");
  }

  // Calculate used days as the difference between end_date and start_date
  const usedDays = Math.ceil(
    (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (usedDays < 0) {
    throw new Error("End date cannot be earlier than start date");
  }

  // Calculate rental price based on used days and discount days
  const effectiveDays = Math.max(0, usedDays - discountDays);
  const rentalPrice = effectiveDays * baseAmount;

  return {
    usedDays,
    effectiveDays,
    rentalPrice
  };
} 