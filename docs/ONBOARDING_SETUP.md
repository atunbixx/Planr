# Onboarding Setup Guide

## Overview

The wedding planner application includes a comprehensive onboarding flow that collects essential information from new users after they sign up with Clerk authentication.

## Onboarding Flow

The onboarding process consists of 4 steps:

1. **About You** - Collects user and partner names
2. **Wedding Details** - Wedding style and date preferences
3. **Venue & Location** - Venue name and location information
4. **Planning & Budget** - Guest count estimate and budget

## Setting up Clerk Redirect

### Option 1: Using Clerk Dashboard (Recommended)

1. Log into your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to your application
3. Go to **Paths** in the sidebar
4. Set the following URLs:
   - **After sign up URL**: `/onboarding`
   - **After sign in URL**: `/dashboard`

### Option 2: Using Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

### Option 3: Programmatic Configuration

In your sign-up component, you can use:

```typescript
import { useSignUp } from '@clerk/nextjs'

const { signUp } = useSignUp()

// After successful sign-up
await signUp.create({
  // ... user data
})

// Redirect to onboarding
window.location.href = '/onboarding'
```

## How the Onboarding Works

### 1. New User Detection

The middleware (`src/middleware.ts`) checks if a user is new by:
- Checking if they have a couple profile in the database
- Verifying the account creation timestamp
- Redirecting new users to `/onboarding` when they try to access protected routes

### 2. Onboarding Page

The onboarding page (`src/app/onboarding/page.tsx`):
- Checks if the user has already completed onboarding
- Displays the carousel flow with progress tracking
- Auto-saves progress to localStorage
- Shows feature previews at the bottom

### 3. Data Collection

Each step collects specific information:
- **Step 1**: Partner names (required: your name, optional: partner's name)
- **Step 2**: Wedding style and date (both optional)
- **Step 3**: Venue details (both optional)
- **Step 4**: Guest count and budget (both optional)

### 4. Data Persistence

- Progress is auto-saved to localStorage after each field change
- On completion, data is saved to the database via `/api/couples`
- Creates both user and couple records in the database

### 5. Post-Onboarding

After successful completion:
- User is redirected to `/dashboard`
- localStorage is cleared
- User can now access all protected features
- If they skip onboarding, they'll be prompted when trying to use features

## Testing the Onboarding Flow

1. **Create a new account** using Clerk sign-up
2. **Verify redirect** to `/onboarding` page
3. **Complete all steps** (or skip some)
4. **Verify redirect** to `/dashboard` after completion
5. **Check database** for created user and couple records

## Customization

### Modifying Steps

To add or modify onboarding steps:

1. Create a new step component in `src/components/onboarding/steps/`
2. Update the `OnboardingData` interface in `OnboardingFlow.tsx`
3. Add the step to the `steps` array in `OnboardingFlow.tsx`
4. Update the progress bar total steps

### Styling

The onboarding uses:
- Rose/purple gradient backgrounds
- Pink accent colors for buttons
- Tailwind CSS for styling
- Responsive design for mobile/desktop

### Validation

- Step 1 requires at least the user's name
- Other fields are optional to reduce friction
- Users can skip steps and complete profile later

## Troubleshooting

### User not redirected to onboarding
- Check Clerk dashboard settings
- Verify environment variables are loaded
- Check middleware is properly configured

### Onboarding data not saving
- Verify API endpoint `/api/couples` is working
- Check database connection
- Verify Clerk user ID is being passed correctly

### User stuck in redirect loop
- Check the onboarding status API endpoint
- Verify database queries are working
- Clear browser cache/localStorage

## API Endpoints

### POST /api/couples
Creates or updates couple profile with onboarding data

### GET /api/user/onboarding-status
Checks if user has completed onboarding

### POST /api/user/initialize
Ensures user record exists in database