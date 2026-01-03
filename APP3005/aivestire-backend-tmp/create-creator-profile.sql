-- Create Creator profile for dd@gmail.com user
INSERT INTO "Creator" (creator_id, user_id, store_name, store_slug, verified, verification_data, created_at)
VALUES (
  gen_random_uuid(),
  '2ac3c583-6458-4f69-ba86-d41b924275f6',
  'DD Store',
  'dd-store',
  true,
  '{"autoCreated": true}'::jsonb,
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  verified = EXCLUDED.verified;
