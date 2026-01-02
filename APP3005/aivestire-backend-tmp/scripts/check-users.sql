-- Check user_id distribution in TryOn table
SELECT 
    user_id,
    COUNT(*) as count
FROM "TryOn"
GROUP BY user_id
ORDER BY count DESC;
