# Prisma Setup Instructions for Supabase

## Step 1: Create Custom Prisma User in Supabase

1. **Go to Supabase SQL Editor**: https://supabase.com/dashboard/project/gpfxxbhowailwllpgphe/sql/new

2. **Copy and paste the SQL from `create-prisma-user.sql`**:
   ```sql
   -- Create custom user
   CREATE USER "prisma" WITH PASSWORD 'PrismaWeddingPlanner2025!' BYPASSRLS CREATEDB;
   
   -- Extend prisma's privileges to postgres (necessary to view changes in Dashboard)
   GRANT "prisma" TO "postgres";
   
   -- Grant it necessary permissions over the relevant schemas (public)
   GRANT USAGE ON SCHEMA public TO prisma;
   GRANT CREATE ON SCHEMA public TO prisma;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
   GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;
   
   -- Set default privileges for future objects
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO prisma;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO prisma;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;
   
   -- Verify the user was created
   SELECT usename, usebypassrls, usecreatedb FROM pg_user WHERE usename = 'prisma';
   ```

3. **Run the SQL** - Click the "Run" button

4. **Verify Success** - You should see output showing the prisma user was created

## Step 2: Update Environment Configuration

After creating the user, I'll update your `.env` file with the new credentials:

- **Username**: `prisma.gpfxxbhowailwllpgphe` (custom user + project ID)
- **Password**: `PrismaWeddingPlanner2025!` (secure generated password)
- **Hostname**: `aws-0-us-east-1.pooler.supabase.com` (working pooler hostname)

## Step 3: Test and Run Migrations

Once the user is created, I'll:
1. Update your `.env` with the new credentials
2. Test the connection
3. Run `npx prisma db push` to create your tables
4. Test the full application

## Why This Solves Our Issues

1. **Authentication**: Custom user with proper permissions
2. **Monitoring**: Better visibility in Supabase dashboard
3. **Security**: Dedicated credentials for Prisma only
4. **Performance**: Uses connection pooling properly

## Ready?

Once you've run the SQL in Supabase and confirmed the user was created, let me know and I'll update your configuration!