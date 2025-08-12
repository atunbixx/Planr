# Onboarding Form Submission Fixes

## Problem
The onboarding form wasn't submitting when clicking "Complete Setup" - getting "Internal Server Error".

## Root Causes
1. The API endpoint was expecting `clerk_user_id` in the request body, but the auth should come from the server-side auth context
2. The API was using Supabase client directly instead of Prisma
3. Missing unique constraint on userId in the Couple model
4. Field name mismatch: API was using camelCase (userId) but database expects snake_case (user_id)
5. Missing required fields in the Couple model (partner1_user_id, partner1_name)

## Fixes Applied

### 1. Updated `/api/couples` Route
- Changed from Supabase client to Prisma ORM
- Removed `clerk_user_id` from request body
- Get authenticated user ID from `auth()` server function
- Added proper error handling
- Set cookie `onboarding_completed` on successful completion
- Fixed field names to match database schema (snake_case)
- Added required fields: partner1_user_id, partner1_name
- Improved error messages for specific constraint violations
- Added data type conversions for numeric fields

### 2. Updated Database Schema
- Added `@unique` constraint to `user_id` field in Couple model
- This ensures one couple profile per user

### 3. Updated Middleware
- Simplified to use cookie-based onboarding status
- Check for `onboarding_completed` cookie
- Redirect to `/onboarding` if cookie is not set

### 4. Updated OnboardingFlow Component
- Removed `clerk_user_id` from request body
- Only send form data and email

## How It Works Now

1. User clicks "Complete Setup" on step 4
2. Form data is sent to `/api/couples` via POST
3. API authenticates user via Clerk's `auth()` function
4. Creates/updates user record in database
5. Creates/updates couple profile
6. Sets `onboarding_completed` cookie
7. Returns success response
8. Frontend redirects to `/dashboard`

## Testing the Fix

1. Go to `/onboarding`
2. Fill out all 4 steps (only name is required)
3. Click "Complete Setup" on the last step
4. Should see loading spinner
5. Should redirect to `/dashboard`
6. Check browser console for any errors

## Debugging

If it still doesn't work:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Complete Setup"
4. Look for POST request to `/api/couples`
5. Check the response status and body

Common issues:
- 401 Unauthorized: User not authenticated
- 400 Bad Request: Missing required fields
- 500 Server Error: Database or code issue

## Database Structure

The onboarding creates:
- User record with clerk_user_id, email, names
- Couple record with wedding details linked to user