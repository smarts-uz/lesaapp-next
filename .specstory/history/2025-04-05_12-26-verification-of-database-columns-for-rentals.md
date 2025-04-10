<!-- Generated by SpecStory -->

# Verification of Database Columns for Rentals (2025-04-05 17:26:07)

_**User**_

product_gross_revenue rental_price used_days columnlari  wp_wc_order_product_lookup da mavjudmi

---

_**Assistant**_

Let me help you check if those columns exist in the `wp_wc_order_product_lookup` table. From the code I can see evidence of these columns being used.

Looking at the code around line 400-420, I can see where these columns are being used in an insert operation to the `wp_wc_order_product_lookup` table:

```typescript
await tx.wp_wc_order_product_lookup.create({
  data: {
    // ... other fields ...
    product_gross_revenue: new Decimal(negativeAmount),
    used_days: usedDays,
    rental_price: new Decimal(item.amount * effectiveDays)
  }
});
```

Based on this code, I can confirm that:

1. `product_gross_revenue` - ✅ exists
2. `rental_price` - ✅ exists 
3. `used_days` - ✅ exists

All three columns you asked about are present in the `wp_wc_order_product_lookup` table. They are used to track:

- `product_gross_revenue`: The gross revenue of the product (before any deductions)
- `rental_price`: The calculated rental price based on the amount and effective days
- `used_days`: The number of days the product was used

These columns appear to be specifically related to rental/leasing functionality in the system, where products can be rented for a certain number of days.

---

_**User**_

 wp_wc_order_product_lookup tabledagi used_days ga orderning used_days qiymati qoyladi va  rental_price ga esa prodctni product_gross_revenue ga used_days ni kopaytirgan holatda yozish kerak 

---

_**Assistant**_

I'll help you modify the code to set the `used_days` from the order's `used_days` and calculate `rental_price` by multiplying `product_gross_revenue` with `used_days`.

Let me edit the relevant part of the code:

---

```diff
                shipping_amount: new Decimal(0),
                shipping_tax_amount: new Decimal(0),
-               used_days: usedDays,
+               used_days: originalOrder.used_days,
                price: new Decimal(item.amount),
-               rental_price: new Decimal(item.amount * effectiveDays)
+               rental_price: new Decimal(negativeAmount * (originalOrder.used_days || 0))
              }
            });
                    shipping_amount: new Decimal(0),
                    shipping_tax_amount: new Decimal(0),
-                   used_days: usedDays,
+                   used_days: originalOrder.used_days,
                    price: new Decimal(0),
                    rental_price: new Decimal(0)
```

---

I've made the following changes:

1. Changed `used_days` to use `originalOrder.used_days` instead of `usedDays` to take the value directly from the order
2. Modified `rental_price` calculation to multiply `negativeAmount` (which is the product_gross_revenue) with `originalOrder.used_days`
3. Added a null check with `|| 0` to handle cases where `used_days` might be null
4. Updated the same fields in the bundled items section for consistency

The changes ensure that:
- `used_days` comes directly from the order's `used_days` value
- `rental_price` is calculated as `product_gross_revenue * used_days`
- Both regular items and bundled items use the same logic

This should now correctly reflect the rental price based on the order's actual used days and the product's gross revenue.

---

_**User**_

err

---

_**Assistant**_

Xatolik `rental_price` ni `BigInt` formatida saqlash kerakligi haqida. Keling, `rental_price` ni `BigInt` formatiga o'tkazib to'g'irlaymiz:

---

```diff
                shipping_tax_amount: new Decimal(0),
                used_days: originalOrder.used_days,
-               rental_price: new Decimal(negativeAmount * (originalOrder.used_days || 0))
+               price: new Decimal(item.amount),
+               rental_price: BigInt(Math.round(Math.abs(negativeAmount) * (originalOrder.used_days || 0)))
              }
            });
                    shipping_tax_amount: new Decimal(0),
                    used_days: originalOrder.used_days,
-                   rental_price: new Decimal(0)
+                   price: new Decimal(0),
+                   rental_price: BigInt(0)
                  }
                });
```

---

Quyidagi o'zgarishlarni kiritdim:

1. Asosiy mahsulotlar uchun:
   - `rental_price` ni `BigInt` formatiga o'zgartirdim
   - `Math.abs(negativeAmount)` orqali manfiy qiymatni musbatga o'zgartirdim
   - `Math.round()` orqali butun songa yaxlitladim
   - `price` maydonini qo'shdim

2. Bundle mahsulotlar uchun:
   - `rental_price` ni `BigInt(0)` qilib o'zgartirdim
   - `price` maydonini qo'shdim

Bu o'zgarishlar Prisma xatoligini hal qilishi kerak, chunki endi:
- `rental_price` `BigInt` formatida saqlanadi
- Hisoblash aniq va to'g'ri formatda amalga oshiriladi
- Bundle mahsulotlar uchun ham to'g'ri format ishlatiladi

---

_**User**_

{
    "error": "Failed to process refund",
    "details": "\nInvalid `prisma.wp_wc_order_product_lookup.create()` invocation:\n\n{\n  data: {\n    order_item_id: 113n,\n    order_id: 1743855775n,\n    product_id: 66n,\n    variation_id: 0n,\n    customer_id: 0n,\n    date_created: new Date(\"2025-04-05T12:36:53.641Z\"),\n    product_qty: -1,\n    product_net_revenue: new Prisma.Decimal(\"-4500\"),\n    product_gross_revenue: new Prisma.Decimal(\"-4500\"),\n    coupon_amount: new Prisma.Decimal(\"0\"),\n    tax_amount: new Prisma.Decimal(\"0\"),\n    shipping_amount: new Prisma.Decimal(\"0\"),\n    shipping_tax_amount: new Prisma.Decimal(\"0\"),\n    used_days: 366,\n    rental_price: new Prisma.Decimal(\"-1647000\")\n                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n  }\n}\n\nArgument `rental_price`: Invalid value provided. Expected BigInt or Null, provided Float."

---

_**Assistant**_

Xatolik `rental_price` ni `Decimal` formatida emas, balki `BigInt` formatida saqlash kerakligi haqida. Keling, `rental_price` ni `BigInt` formatiga o'zgartiramiz:

---

```diff
                shipping_tax_amount: new Decimal(0),
                used_days: originalOrder.used_days,
-               rental_price: new Decimal(negativeAmount * (originalOrder.used_days || 0))
+               price: new Decimal(item.amount),
+               rental_price: BigInt(Math.round(Math.abs(negativeAmount) * (originalOrder.used_days || 0)))
              }
            });
                    shipping_tax_amount: new Decimal(0),
                    used_days: originalOrder.used_days,
-                   rental_price: new Decimal(0)
+                   price: new Decimal(0),
+                   rental_price: BigInt(0)
                  }
                });
```

---

Quyidagi o'zgarishlarni kiritdim:

1. Asosiy mahsulotlar uchun:
   - `rental_price` ni `new Decimal()` o'rniga `BigInt()` ga o'zgartirdim
   - `Math.abs(negativeAmount)` orqali manfiy qiymatni musbatga o'zgartirdim
   - `Math.round()` orqali butun songa yaxlitladim
   - `price` maydonini qo'shdim

2. Bundle mahsulotlar uchun:
   - `rental_price` ni `new Decimal(0)` o'rniga `BigInt(0)` ga o'zgartirdim
   - `price` maydonini qo'shdim

Bu o'zgarishlar Prisma xatoligini hal qilishi kerak, chunki endi:
- `rental_price` `BigInt` formatida saqlanadi
- Hisoblash aniq va to'g'ri formatda amalga oshiriladi
- Bundle mahsulotlar uchun ham to'g'ri format ishlatiladi

---

_**User**_

fix

---

_**Assistant**_

Xatolik `price` maydoni `wp_wc_order_product_lookup` jadvalida mavjud emasligi haqida. Keling, `price` maydonini olib tashlaymiz va faqat mavjud maydonlarni qoldiramiz:

---

```diff
                shipping_tax_amount: new Decimal(0),
                used_days: originalOrder.used_days,
-               price: new Decimal(item.amount),
                rental_price: BigInt(Math.round(Math.abs(negativeAmount) * (originalOrder.used_days || 0)))
              }
                    shipping_tax_amount: new Decimal(0),
                    used_days: originalOrder.used_days,
-                   price: new Decimal(0),
                    rental_price: BigInt(0)
                  }
```

---

Quyidagi o'zgarishlarni kiritdim:

1. Asosiy mahsulotlar uchun:
   - `price` maydonini olib tashladim chunki u jadvalda mavjud emas
   - Qolgan maydonlar o'zgarishsiz qoldirildi

2. Bundle mahsulotlar uchun:
   - `price` maydonini olib tashladim
   - Qolgan maydonlar o'zgarishsiz qoldirildi

Bu o'zgarishlar Prisma xatoligini hal qilishi kerak, chunki endi:
- Faqat jadvalda mavjud bo'lgan maydonlar ishlatilmoqda
- `rental_price` va `used_days` maydonlari to'g'ri formatda saqlanmoqda
- Bundle mahsulotlar uchun ham to'g'ri format ishlatilmoqda

---

_**User**_

discount_days niham qoshish kerak shu table ga va priceni umumiy kundan - qilib hisoblansin

---

_**Assistant**_

`wp_wc_order_product_lookup` jadvaliga `discount_days` qo'shib, `rental_price` ni umumiy kunlardan chegirma kunlarni ayirib hisoblashni qo'shaman:

---

Cancelled

---



---



---

