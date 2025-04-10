<!-- Generated by SpecStory -->

# Removing Unnecessary Subtotal from Summary (2025-04-02 11:35:42)

_**User**_

Get rid of subtotal as it's simply unnecessary

---

_**Assistant**_

I'll edit the cart summary to remove the subtotal section since it's redundant with the total.

---

```diff
      <div className="p-4 border-t">
        <div className="space-y-2 mb-4">
-         <div className="flex justify-between">
-           <span className="text-muted-foreground">Subtotal</span>
-           <span>{formatCurrency(subtotal)}</span>
-         </div>
-         <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
```

---

I've removed the subtotal section and the separator, keeping only the total amount display. The component will now show a cleaner interface with just the final total.

---

_**User**_

@app hide the dashboard tab

---

_**Assistant**_

Let me search for the navigation component to hide the dashboard tab.

---

<details>
            <summary>Searched codebase "navigation component with dashboard tab or link" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `components/dashboard/sidebar.tsx` | L1-40 |
| `components/ui/navigation-menu.tsx` | L45-80 |
| `app/dashboard/settings/page.tsx` | L25-47 |
| `components/dashboard/sidebar.tsx` | L40-80 |
| `app/page.tsx` | L1-40 |
| `app/dashboard/page.tsx` | L1-19 |
| `components/ui/navigation-menu.tsx` | L1-45 |
| `components/ui/navigation-menu.tsx` | L80-128 |
| `app/dashboard/bookings/page.tsx` | L1-22 |
| `components/ui/tabs.tsx` | L1-55 |
| `app/dashboard/layout.tsx` | L1-15 |
| `app/dashboard/settings/page.tsx` | L113-141 |
| `app/dashboard/bookings/page.tsx` | L22-66 |
| `app/dashboard/page.tsx` | L52-76 |
| `components/dashboard/header.tsx` | L31-69 |
| `app/dashboard/settings/page.tsx` | L250-280 |
| `app/dashboard/orders/[id]/page.tsx` | L181-218 |
| `app/dashboard/page.tsx` | L19-52 |
| `components/dashboard/overview.tsx` | L1-61 |
| `app/dashboard/discounts/page.tsx` | L1-50 |
| `app/dashboard/orders/[id]/page.tsx` | L1-17 |
| `app/page.tsx` | L40-78 |
| `components/ui/breadcrumb.tsx` | L1-73 |
| `app/dashboard/settings/page.tsx` | L344-388 |
| `app/dashboard/settings/page.tsx` | L184-214 |

</details>

---

I found the navigation component in `components/dashboard/sidebar.tsx`. I'll modify it to remove the dashboard tab.

---

```diff

  const routes = [
-   {
-     label: "Dashboard",
-     icon: LayoutDashboard,
-     href: "/dashboard",
-     color: "text-sky-500",
-   },
    {
      label: "POS",
```

---

I've removed the dashboard route from the sidebar navigation. The dashboard tab will no longer appear in the navigation menu.

---

_**User**_

@app delete discounts tab completely

---

_**Assistant**_

I'll remove the discounts tab from the sidebar navigation.

---

```diff
      color: "text-pink-700",
    },
-   {
-     label: "Discounts",
-     icon: Tag,
-     href: "/dashboard/discounts",
-     color: "text-emerald-500",
-   },
    {
      label: "Settings",
```

---

I've removed the discounts route from the sidebar navigation. The discounts tab will no longer appear in the navigation menu.

---

_**User**_

@app scan the code & remove discount related ones

---

_**Assistant**_

I'll search for and remove all discount-related code.

---

<details>
            <summary>Searched codebase "discount component or page" • **25** results</summary>
        
| File | Lines |
|------|-------|
| `app/dashboard/discounts/page.tsx` | L1-50 |
| `components/dashboard/discounts-table.tsx` | L38-66 |
| `components/dashboard/discounts-table.tsx` | L1-38 |
| `components/dashboard/discounts-table.tsx` | L131-179 |
| `components/dashboard/new-discount-form.tsx` | L136-158 |
| `components/dashboard/discounts-table.tsx` | L104-131 |
| `components/dashboard/discounts-table.tsx` | L66-104 |
| `components/dashboard/new-discount-form.tsx` | L59-98 |
| `types/pos.ts` | L193-203 |
| `components/dashboard/new-discount-form.tsx` | L1-59 |
| `components/pos/cart-summary.tsx` | L11-40 |
| `lib/woocommerce.ts` | L753-764 |
| `components/dashboard/new-discount-form.tsx` | L98-136 |
| `app/dashboard/orders/[id]/page.tsx` | L318-353 |
| `.specstory/history/2025-03-31_13-36-refactoring-posclient-into-smaller-components.md` | L639-684 |
| `app/dashboard/settings/page.tsx` | L214-250 |
| `components/pos/pos-client.tsx` | L337-364 |
| `components/pos/product-grid.tsx` | L37-73 |
| `components/dashboard/refund-dialog.tsx` | L529-557 |
| `app/dashboard/pos/page.tsx` | L221-255 |
| `components/pos/pos-client.tsx` | L497-520 |
| `components/dashboard/refund-dialog.tsx` | L490-529 |
| `components/dashboard/refund-dialog.tsx` | L402-450 |
| `components/dashboard/refund-dialog.tsx` | L1-37 |
| `components/pos/bundle-customization-dialog.tsx` | L212-233 |

</details>

---

I'll remove all discount-related code. Let me start with the files:

1. First, let's delete the discounts page and its components:

---

Cancelled

---

---

---
