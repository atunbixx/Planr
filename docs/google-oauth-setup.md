# Google OAuth Setup Guide for Supabase

This guide will help you configure Google OAuth authentication in your Supabase project to prevent white screen issues and authentication errors.

## Prerequisites

- A Supabase project
- A Google Cloud Console account
- Admin access to both platforms

## Step 1: Create Google OAuth Credentials

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**

### 1.2 Create OAuth 2.0 Client ID
1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your domain to **Authorized domains**
   - Save and continue through all steps

3. For the OAuth client ID:
   - Application type: **Web application**
   - Name: Your app name (e.g., "Wedding Planner App")
   - Authorized JavaScript origins:
     - `http://localhost:4010` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:4010/auth/callback` (for development)

4. Click **Create** and save your **Client ID** and **Client Secret**

## Step 2: Configure Supabase Authentication

### 2.1 Enable Google Provider
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and toggle it **ON**

### 2.2 Add Google Credentials
1. In the Google provider settings:
   - **Client ID**: Paste your Google OAuth Client ID
   - **Client Secret**: Paste your Google OAuth Client Secret
2. Click **Save**

### 2.3 Configure Redirect URLs
1. In **Authentication** > **URL Configuration**:
   - **Site URL**: `http://localhost:4010` (development) or `https://yourdomain.com` (production)
   - **Redirect URLs**: Add both:
     - `http://localhost:4010/auth/callback`
     - `https://yourdomain.com/auth/callback`

## Step 3: Update Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 4: Test the Configuration

### 4.1 Development Testing
1. Start your development server: `npm run dev`
2. Navigate to the sign-in page
3. Click "Sign in with Google"
4. You should be redirected to Google's OAuth consent screen
5. After granting permission, you should be redirected back to your app

### 4.2 Common Issues and Solutions

#### White Screen After Google Sign-in
**Cause**: Usually indicates a configuration mismatch

**Solutions**:
1. **Check redirect URLs**: Ensure they match exactly in both Google Console and Supabase
2. **Verify domain authorization**: Make sure your domain is added to Google's authorized domains
3. **Check console logs**: Open browser dev tools to see detailed error messages
4. **Validate environment variables**: Ensure all Supabase keys are correct

#### "redirect_uri_mismatch" Error
**Cause**: The redirect URI in the request doesn't match any authorized URIs

**Solutions**:
1. Add the exact redirect URI to Google Console
2. Ensure the URI includes the correct protocol (http/https)
3. Check for trailing slashes or extra parameters

#### "access_denied" Error
**Cause**: User denied permission or OAuth consent screen issues

**Solutions**:
1. Complete OAuth consent screen configuration
2. Ensure app is not in testing mode with restricted users
3. Add test users if in testing mode

#### "invalid_client" Error
**Cause**: Incorrect client ID or client secret

**Solutions**:
1. Verify client ID and secret in Supabase dashboard
2. Regenerate credentials if necessary
3. Ensure no extra spaces or characters

## Step 5: Production Deployment

### 5.1 Update Google Console
1. Add production domain to **Authorized JavaScript origins**
2. Add production callback URL to **Authorized redirect URIs**
3. Update OAuth consent screen with production domain

### 5.2 Update Supabase
1. Add production URLs to Supabase redirect URLs
2. Update site URL to production domain

### 5.3 Environment Variables
Ensure production environment has correct Supabase credentials

## Debugging Tips

### Enable Debug Logging
The app includes comprehensive logging for OAuth flows. Check browser console for:
- 🔄 OAuth initiation logs
- ❌ Error details with specific messages
- ✅ Success confirmations

### Common Log Messages
- `"No redirect URL received"`: OAuth provider configuration issue
- `"Provider not enabled"`: Google provider not enabled in Supabase
- `"Invalid login credentials"`: User account or permission issue

### Testing Checklist
- [ ] Google OAuth client created with correct redirect URIs
- [ ] Google provider enabled in Supabase
- [ ] Client ID and secret added to Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Environment variables set correctly
- [ ] OAuth consent screen configured
- [ ] Domain authorized in Google Console
- [ ] Testing with correct user account

## Support

If you continue experiencing issues:
1. Check the browser console for detailed error messages
2. Verify all URLs match exactly between Google Console and Supabase
3. Test with a fresh incognito/private browser window
4. Ensure your Google account has necessary permissions

For additional help, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)