# Database Scripts

This folder contains utility scripts for database management and setup.

## Available Scripts

### 1. Create Admin User
Creates an admin user with default credentials.

```bash
npm run script:create-admin
```

**Default Credentials:**
- Email: `admin@aivestire.com`
- Password: `Admin@123456`

⚠️ **Important:** Change the password after first login!

**What it does:**
- Creates a new admin user with hashed password
- Checks if admin already exists (won't create duplicates)
- Updates existing user to ADMIN role if needed
- Provides clear output with credentials

---

### 2. Check Database Status
Displays current database statistics.

```bash
npm run script:check-db
```

**Shows:**
- User counts by role (Creators, Admins, Buyers)
- Product counts by status (Draft, Pending, Approved, Rejected)
- Total approvals
- List of all admin users

---

### 3. Seed 1-Rupee Test Product
Creates or updates a public approved product priced at exactly `₹1.00` for payment testing.

```bash
npm run script:seed-one-rupee-product
```

**What it does:**
- Creates or reuses a dedicated creator account for testing
- Upserts one approved product with:
  - `price_cents=100`
  - `commission_percentage=0`
  - inventory in stock
- Replaces the product image with `/images/product-1.png`

**Useful overrides:**
- `TEST_PRODUCT_TITLE`
- `TEST_PRODUCT_SLUG`
- `TEST_PRODUCT_PRICE_CENTS`
- `TEST_PRODUCT_IMAGE_URL`
- `TEST_PRODUCT_CREATOR_EMAIL`

---

## How to Run Scripts

### Method 1: Using npm scripts (Recommended)
```bash
# Create admin user
npm run script:create-admin

# Check database status
npm run script:check-db

# Seed the 1-rupee payment test product
npm run script:seed-one-rupee-product
```

### Method 2: Using ts-node directly
```bash
# Create admin user
npx ts-node scripts/create-admin.ts

# Check database status
npx ts-node scripts/check-db-status.ts
```

---

## Adding New Scripts

1. Create a new `.ts` file in the `scripts/` folder
2. Add the script command to `package.json`:
   ```json
   "scripts": {
     "script:your-script": "ts-node scripts/your-script.ts"
   }
   ```
3. Run with: `npm run script:your-script`

---

## Notes

- All scripts use Prisma Client for database access
- Scripts automatically disconnect from database after completion
- Error handling is built-in with clear error messages
- Scripts are safe to run multiple times (idempotent where applicable)
