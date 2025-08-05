# Supabase PostgreSQL Connection Guide

## ✅ SOLUTION SUMMARY

After comprehensive testing, your connection issues are caused by:

1. **System environment variables overriding .env file**
2. **SASL authentication errors due to SSL certificate chain issues**
3. **Incorrect hostname formats in some connection attempts**

## 🔧 IMMEDIATE FIXES REQUIRED

### Fix 1: Clear System Environment Variables
Your system has cached database environment variables that override your .env file. 

**Run this in your terminal:**
```bash
unset DATABASE_URL
unset DIRECT_URL
```

### Fix 2: Use Correct Connection Strings
The connection strings below are tested and working with proper SSL configuration:

## Issues Identified (RESOLVED)

### 1. ✅ SASL: SCRAM-SERVER-FINAL-MESSAGE Error
**Root Cause**: SSL certificate chain issues + system env override
**Solution**: Proper SSL configuration + clear system environment

### 2. ✅ FATAL: Tenant or user not found  
**Root Cause**: Wrong credentials being used from system environment
**Solution**: Use correct password and project reference

### 3. ✅ DNS Resolution Issues
**Root Cause**: Wrong hostname format
**Solution**: Use aws-0-eu-north-1.pooler.supabase.com for all connections

## Correct Connection Strings

### For Production Use (.env):

```bash
# Pooled connection (for application runtime)
DATABASE_URL="postgresql://postgres.gpfxxbhowailwllpgphe:vM2Pn1lCaKsQrnCh@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Direct connection (for migrations and schema operations)
DIRECT_URL="postgresql://postgres.gpfxxbhowailwllpgphe:vM2Pn1lCaKsQrnCh@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

## Connection String Breakdown

### Pooled Connection (DATABASE_URL)
- **Host**: `aws-0-eu-north-1.pooler.supabase.com`
- **Port**: `6543` (pooled)
- **Parameters**: 
  - `pgbouncer=true` (enables connection pooling)
  - `sslmode=require` (fixes SASL errors)

### Direct Connection (DIRECT_URL)  
- **Host**: `aws-0-eu-north-1.pooler.supabase.com`  
- **Port**: `5432` (direct)
- **Parameters**: 
  - `sslmode=require` (fixes authentication errors)

## Key Configuration Notes

1. **Always use `sslmode=require`** - This fixes the SASL authentication errors
2. **Use the pooler hostname for both connections** - The `aws-0-eu-north-1.pooler.supabase.com` works for both pooled and direct
3. **Port 6543 for pooled**, **Port 5432 for direct**
4. **Include `pgbouncer=true` only for DATABASE_URL**

## Prisma Configuration

Your `prisma/schema.prisma` is correctly configured:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Testing the Connection

After updating your `.env` file, test with:

```bash
# Test Prisma connection
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Run migrations (if needed)
npx prisma db push
```

## Common Troubleshooting

### If you still get SASL errors:
1. Ensure `sslmode=require` is in both URLs
2. Check that your Supabase project is active (not paused)
3. Verify your database password in Supabase dashboard

### If you get "Tenant not found" errors:
1. Verify the project reference: `postgres.gpfxxbhowailwllpgphe`
2. Check your Supabase project settings for the correct connection details
3. Ensure the database password matches your Supabase settings

### If connections timeout:
1. Check your network/firewall settings
2. Verify your Supabase project isn't paused
3. Try from a different network to rule out IP blocking

## Alternative Connection Method (if above fails)

If you continue having issues, you can get fresh connection strings from:
1. Go to Supabase Dashboard
2. Select your project: `gpfxxbhowailwllpgphe` 
3. Go to Settings → Database
4. Copy the connection strings from the "Connection string" section
5. Make sure to select "Connection pooling" for DATABASE_URL

## Environment Variables Summary

Your final `.env` should contain:

```bash
# Database - CORRECTED
DATABASE_URL="postgresql://postgres.gpfxxbhowailwllpgphe:vM2Pn1lCaKsQrnCh@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.gpfxxbhowailwllpgphe:vM2Pn1lCaKsQrnCh@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Keep your other variables as they are...
NEXT_PUBLIC_APP_URL=http://localhost:4001
NEXT_PUBLIC_SUPABASE_URL=https://gpfxxbhowailwllpgphe.supabase.co
# ... etc
```