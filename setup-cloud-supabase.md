# 🚀 Fix Database: Switch to Cloud Supabase

Your local Docker Supabase is having issues. Let's fix this by using cloud Supabase instead.

## Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign up/login
2. **Click "New Project"**
3. **Choose these settings:**
   - Name: `wedding-planner-v2`
   - Database Password: `Teniola=1` (or create a secure one)
   - Region: Choose closest to you

## Step 2: Get Your Credentials

1. **Go to Settings > API** in your new project
2. **Copy these values:**
   - Project URL: `https://your-project-ref.supabase.co`
   - Anon Key: `eyJhbGc...` (long string)

## Step 3: Update Environment

Replace your `.env.local` with:

```bash
# Your Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Development Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 4: Run Database Setup

After updating `.env.local`, run:

```bash
# Apply the database schema
npm run db:migrate

# Add sample data
npm run db:seed
```

## Step 5: Create Demo User

In your Supabase dashboard:

1. **Go to Authentication > Users**
2. **Click "Add User"**
3. **Create user with:**
   - Email: `hello@atunbi.net`
   - Password: `Teniola=1`
   - Confirm: Yes

## ✅ Ready to Test

Once complete, you should be able to login with:
- **Email:** `hello@atunbi.net`
- **Password:** `Teniola=1`

---

**Need Help?** Let me know your Supabase project URL and I can help set up the database schema automatically.