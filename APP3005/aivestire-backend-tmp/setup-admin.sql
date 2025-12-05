-- Admin Dashboard Module - Database Setup Script
-- Run this to create an admin user for testing

-- 1. Create or update an admin user
-- Replace 'admin@aivestire.com' with your desired admin email

UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@aivestire.com';

-- If the user doesn't exist, you'll need to create one first via the signup endpoint
-- Then run the UPDATE query above

-- 2. Verify admin user exists
SELECT user_id, email, role 
FROM "User" 
WHERE role = 'ADMIN';

-- 3. Check pending products (should have some for testing)
SELECT p.product_id, p.title, p.status, c.store_name as creator_name
FROM "Product" p
JOIN "Creator" c ON p.creator_id = c.creator_id
WHERE p.status = 'PENDING' AND p.is_deleted = false
ORDER BY p.created_at ASC;

-- 4. Check existing approvals
SELECT 
  pa.approval_id,
  p.title as product_title,
  pa.status,
  pa.comment,
  pa.actioned_at
FROM "ProductApproval" pa
JOIN "Product" p ON pa.product_id = p.product_id
ORDER BY pa.created_at DESC
LIMIT 10;
