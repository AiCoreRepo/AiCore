-- Fix user role from BUYER to CREATOR
-- Run this in your PostgreSQL database or via Prisma Studio

-- Update the user's role to CREATOR
UPDATE "User" 
SET role = 'CREATOR' 
WHERE user_id = '2ac3c583-6458-4f69-ba86-d41b924275f6';

-- Create a Creator profile for this user
INSERT INTO "Creator" (creator_id, user_id, store_name, store_slug, verified, verification_data, created_at)
VALUES (
  gen_random_uuid(),
  '2ac3c583-6458-4f69-ba86-d41b924275f6',
  'My Store',
  'my-store-' || floor(random() * 10000)::text,
  true,
  ('{"autoCreated": true, "timestamp": "' || NOW()::text || '"}')::jsonb,
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;
