-- Create dedicated Prisma user with full privileges
-- Run this in your Supabase SQL Editor

-- Create the prisma user
CREATE USER prisma WITH PASSWORD 'sKcgim88KVDX9gCdJp+WrM7SaKunoLuAHUIC28Pc2F8=';

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE postgres TO prisma;
GRANT ALL ON SCHEMA public TO prisma;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prisma;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prisma;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO prisma;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prisma;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO prisma;