# Creator Onboarding & Profile Management

## 1. Overview
The Creator Onboarding system is a seamless, three-step progressive wizard that collects essential business and payment details from a newly registered creator before they are granted access to the platform's Creator Dashboard. It ensures that critical compliance data (like Address and UPI Verification) and legal agreements (Terms & Conditions) are firmly established upfront.

## 2. Onboarding Flow (The 3-Step Wizard)
The legacy separate popups have been entirely replaced by a single-page Application Router flow located at `/creator-onboarding`. The wizard handles state persistence so users can drop off and resume without losing progress.

### Step 1: Business Address
Collects the creator's operational address. This data is strictly normalized in the backend.
- **Fields Collected:** Full Name, Contact Phone, Address Line 1 & 2, City, State, Pincode.
- **Validation:** Enforces 10+ digit phone numbers, strict 6-digit postal codes, and mandatory completion of required fields via HTML5 native validation.

### Step 2: Payout Details
Collects and actively verifies the creator's UPI ID using integration with PayU.
- **Verification:** Users must "Verify" their UPI ID before proceeding.
- **Auto-fill:** The beneficiary account name is auto-fetched from the bank records to prevent typos and ensure KYC match.
- **Security:** Highlighted UI messages ensure creators know their financial data is securely transmitted and that PINs are never requested.

### Step 3: Terms & Conditions
Presents the platform's Creator/Partner terms.
- **Layout:** Replaces the legacy long-scrollable modal with a highly premium, interactive sidebar layout. Users select term sections on the left to view beautifully formatted details on the right.
- **Acceptance:** Requires explicit checkbox confirmation of the terms before unlocking dashboard access.

---

## 3. Database Architecture (`schema.prisma`)
The feature introduces a normalized schema for address storage, actively separating it from the primary `User` or `Creator` tables.

```prisma
model CreatorAddress {
  address_id    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  creator_id    String   @unique @db.Uuid // 1-to-1 strict relationship with Creator
  full_name     String
  phone         String
  address_line1 String
  address_line2 String?
  city          String
  state         String
  pincode       String
  country       String   @default("India")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  creator Creator @relation(fields: [creator_id], references: [creator_id], onDelete: Cascade)

  @@map("creator_addresses")
}
```
*Note: A `@unique` constraint on `creator_id` enforces a strict 1-to-1 relationship, eliminating N+1 query risks during profile fetching.*

---

## 4. API Endpoints (NestJS Backend)
The onboarding wizard relies on the `CreatorsController` and `CreatorsService`.

### `POST /creators/address`
- **Purpose:** Upserts the `CreatorAddress` for the authenticated creator.
- **Idempotency:** Uses `prisma.creatorAddress.upsert` based on the unique `creator_id`, ensuring no duplicated records.

### `GET /creators/address`
- **Purpose:** Retrieves the currently saved address.
- **Usage:** Pre-fills the form during onboarding or within the dashboard settings.

*Payout Details and Terms Acceptance continue to use their existing endpoints (`updateProfile` and `acceptCreatorTerms`).*

---

## 5. Frontend Architecture & Components
- **`src/app/creator-onboarding/page.tsx`**: The main wizard. Maintains localized state for all 3 steps. Uses an absolute `!important` color override class on `Input` elements to enforce strict visibility in the dark-themed UI.
- **`src/lib/api.ts`**: Contains the typed frontend networking bridges: `saveCreatorAddress(data: CreatorAddressData)` and `getCreatorAddress()`.
- **`src/lib/creatorOnboarding.ts`**: Centralized onboarding logic. Determines `isComplete` only when `hasAddress`, `hasPaymentDetails`, and `termsAccepted` are all definitively `true`. 

---

## 6. Dashboard Settings Integration
Because onboarding data must remain editable post-onboarding, the `SettingsContent.tsx` component inside the Creator Dashboard (`/settings`) was extended to act as the permanent home for this data.

- **Unified Management:** The Settings page loads `user` (for profile/payouts) and `getCreatorAddress()` (for business address).
- **Single Save Action:** The layout provides a single global "Save Changes" button. Modifying the Store Name, Payout UPI, or Business Address triggers parallel API mutations under a shared loading state.
- **Validation Parity:** All client-side validations utilized during the onboarding wizard (Regex for UPI, Regex for Pincodes) are identically replicated here to guarantee data integrity over time.
