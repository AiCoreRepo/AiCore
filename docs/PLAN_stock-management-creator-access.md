# Feature Plan: Creator Stock Management

**Branch:** `atul/feat/stock-management-access-creators`  
**Date:** 2026-06-09  
**Author:** Atul Raina

---

## Goal

Give creators the ability to view and update stock levels for all their uploaded products
directly from the Creator Dashboard — without needing admin intervention.

---

## Background

Currently, stock is managed exclusively by admins via the Admin Inventory page.
Creators upload products with patterns → colour variants → size stocks, but have
no way to adjust stock after upload. This feature unlocks that access.

---

## Data Model (existing — no schema changes needed)

```
Product
  └── ProductPattern          (e.g. "Slim Fit", "Relaxed Fit")
        └── ProductColorVariant   (e.g. BLACK, RED)
              ├── ProductColorVariantImage
              └── ProductColorSizeStock   (size: "S/M/L/XL", stock: Int)
```

`Product.inventory_count` = sum of all `ProductColorSizeStock.stock` rows.

---

## What We're Building

### 1. Backend — New Endpoint: `GET /creator-dashboard/stock-management`

- **Auth:** JWT + CREATOR role (existing guards)
- **Returns:** All non-deleted products belonging to the creator with full hierarchy:
  - Product info (title, status, total stock, primary image)
  - Patterns (name, body_shapes, display_order)
  - Color variants per pattern (color, hex_code, primary image)
  - Size stocks per variant (size, stock, size_stock_id)
- **Separate** from the existing `GET /creator-dashboard/products` endpoint
  (which is paginated, lightweight, and used by the products tab)

### 2. Backend — New Endpoint: `PATCH /creator-dashboard/stock-management/:variantId/sizes/:size`

- **Auth:** JWT + CREATOR role
- **Body:** `{ stock: number }` (validated: integer, min 0)
- **Logic:**
  1. Find the `ProductColorSizeStock` row for `variantId + size`
  2. Verify the creator owns the product (via variant → pattern → product → creator)
  3. Update the stock value
  4. Re-sync `Product.inventory_count` (sum of all size stocks for that product)
  5. Return updated variant stock summary

### 3. Frontend — New API Module: `src/api/creator-stock.api.ts`

Typed fetch functions + TypeScript interfaces for the two new endpoints.

### 4. Frontend — New Page: `src/app/stock-management/page.tsx`

**Layout:**
- Same sidebar layout as all other creator pages
- Product list on left (or top on mobile) — clickable rows
- Expanded detail panel showing Pattern → Colour → Size tree

**Product Row:**
- Thumbnail, title, status badge, total-stock badge (colour-coded)
- `ChevronDown/Up` expand icon

**Expanded Panel (Pattern sections):**
- Pattern name + body shapes tags (Lucide: `Layers`)
- Colour variant cards (Lucide: `Palette`) with colour swatch
- Size-stock table: size | stock | edit button

**Inline Stock Editing:**
- Click edit icon (Lucide: `Edit2`) → stock cell becomes `<input type="number" min="0">`
- Save on Enter or blur
- Optimistic update → rollback on API error with toast
- Loading spinner (Lucide: `RefreshCw` with spin class) during save

**Stock Badges:**
| Stock | Badge | Lucide Icon |
|---|---|---|
| 0 | Red · "Out of Stock" | `AlertTriangle` |
| 1–10 | Amber · "Low Stock" | `AlertTriangle` |
| 11+ | Green · "In Stock" | `CheckCircle2` |

**Edge Cases:**
- No products → empty state + link to upload
- Product has no patterns (legacy) → show `inventory_count` only
- Variant has no size stocks → "No sizes configured"
- Stock update fails → toast error + value rollback
- Negative input → blocked (`min={0}` + DTO `@Min(0)`)
- Mobile → stacked layout, full-width cards

### 5. Frontend — Routing

New lazy route at `/stock-management` in `App.tsx`,
wrapped in `ProtectedRoute (CREATOR)` + `CreatorOnboardingGuard`.

### 6. Frontend — Sidebar Nav

Add `{ label: "Stock Management", icon: <Package size={20} />, href: "/stock-management" }`
to `creatorNavLinks.tsx`.

---

## Files Changed

| File | Change |
|---|---|
| `src/creator-dashboard/creator-dashboard.controller.ts` | Add 2 endpoints |
| `src/creator-dashboard/creator-dashboard.service.ts` | Add 2 service methods |
| `src/creator-dashboard/dto/update-size-stock.dto.ts` | **NEW** DTO |
| `src/api/creator-stock.api.ts` | **NEW** API module |
| `src/app/stock-management/page.tsx` | **NEW** Page component |
| `src/App.tsx` | Add route |
| `src/components/creator/creatorNavLinks.tsx` | Add nav link |

---

## Out of Scope

- Bulk stock import (CSV) — future enhancement
- Stock history / audit log — future enhancement
- Admin override of creator stock — already exists in admin inventory
- Docker build fix for recommendation-api (separate issue, network limitation)

---

## Verification

1. `npm run backend` → new endpoints listed in NestJS boot logs
2. `GET /creator-dashboard/stock-management` with CREATOR JWT → returns product hierarchy
3. `PATCH /creator-dashboard/stock-management/:variantId/sizes/M` with `{ stock: 5 }` → updates DB
4. Open `/stock-management` in browser → products load, tree expands, inline edit works
5. Set stock to 0 → badge turns red
6. Mobile viewport (375px) → layout stacks correctly
