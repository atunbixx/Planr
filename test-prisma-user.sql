-- Check if prisma_user exists
SELECT 
    'User exists' as status,
    usename as username,
    usesuper as is_superuser,
    usecreatedb as can_create_db
FROM pg_user 
WHERE usename = 'prisma_user';

-- If no results, the user doesn't exist yet
-- Run the setup-prisma-user.sql script first