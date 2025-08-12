-- Check the foreign key constraint
SELECT 
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='user_roles';

-- Check if the user exists
SELECT id, email FROM users WHERE email = 'atunbi1@gmail.com';

-- Try to insert directly with SQL
INSERT INTO user_roles (user_id, role) 
VALUES ('a0a857fb-3291-4860-855b-f61e1f0c0cd7', 'superAdmin') 
ON CONFLICT (user_id, role) DO UPDATE SET role = 'superAdmin';