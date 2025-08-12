# Account Sharing and Delegation System

## Overview

The wedding planner application now supports comprehensive account sharing and delegation, allowing couples to invite collaborators with specific roles and permissions.

## Roles

### 1. Owner
- **Description**: The wedding couple who created the account
- **Permissions**: Full access to all features
- **Automatic**: Assigned to the user who completes onboarding

### 2. Wedding Planner
- **Role**: `planner`
- **Description**: Professional wedding planner with comprehensive access
- **Default Permissions**:
  - All permissions except account deletion
  - Can manage guests, budget, vendors, photos, tasks
  - Can invite other collaborators

### 3. Family Member
- **Role**: `family`
- **Description**: Close family members with moderate access
- **Default Permissions**:
  - View all information
  - Edit guest information
  - View budget
  - View and upload photos

### 4. Vendor
- **Role**: `vendor`
- **Description**: Wedding vendors with limited access
- **Default Permissions**:
  - View dashboard
  - View schedule
  - Manage their own vendor information

### 5. Guest
- **Role**: `guest`
- **Description**: Wedding guests with minimal access
- **Default Permissions**:
  - View dashboard
  - View basic information

## Permissions

| Permission | Description |
|------------|-------------|
| `view` | View dashboard and basic information |
| `edit` | Edit wedding details and settings |
| `manage_guests` | Add, delete, and manage guests |
| `edit_guests` | Edit guest information and RSVP status |
| `manage_budget` | Add and manage budget items |
| `view_budget` | View budget information |
| `manage_vendors` | Add and manage vendors |
| `view_schedule` | View wedding schedule |
| `manage_tasks` | Create and manage tasks |
| `manage_photos` | Upload and manage photos |
| `view_photos` | View photo gallery |
| `manage_own_vendor` | Vendors can manage their own information |

## How to Share Your Account

1. Navigate to **Settings** in the dashboard
2. Click on **Sharing & Collaboration**
3. Click **Invite Collaborator**
4. Fill in:
   - Email address
   - Select a role (Planner, Family, Vendor, or Guest)
   - Customize permissions if needed
5. Click **Send Invitation**

## Invitation Flow

1. **Invitation Sent**: The collaborator receives an email with an invitation link
2. **Acceptance Page**: Clicking the link shows:
   - Who invited them
   - Their assigned role
   - Permissions they'll have
3. **Sign Up/Sign In**: 
   - New users: Create an account
   - Existing users: Sign in
4. **Access Granted**: After accepting, they're redirected to the dashboard

## Permission Enforcement

### Navigation
- Menu items are hidden based on permissions
- Users only see features they can access

### Page Access
- Middleware checks permissions before allowing access
- Unauthorized access redirects to dashboard
- API endpoints return 403 Forbidden for insufficient permissions

### Feature Controls
- Buttons and actions are hidden for users without permission
- Edit/delete options only shown to authorized users

## Managing Collaborators

### View Collaborators
1. Go to Settings > Sharing & Collaboration
2. See all active collaborators with:
   - Name and email
   - Role and permissions
   - Invitation status
   - Date added

### Remove Access
1. Click the menu icon next to a collaborator
2. Select "Remove Access"
3. Confirm the action

### Resend Invitation
- For pending invitations, click "Resend"
- Generates a new invitation link

## Best Practices

1. **Start with Roles**: Use predefined roles when possible
2. **Customize Carefully**: Only modify permissions when needed
3. **Regular Reviews**: Periodically review who has access
4. **Vendor Access**: Give vendors only what they need
5. **Family vs Planner**: Reserve planner role for professionals

## Technical Implementation

### Database Schema
- `couple_collaborators` table stores all collaborations
- `permissions` field stores array of permission strings
- `invitation_token` enables secure invitation acceptance
- `status` tracks pending/accepted/removed states

### Security
- Unique invitation tokens expire after use
- Email verification ensures invitations go to intended recipients
- Middleware enforces permissions on every request
- API endpoints validate permissions server-side

### Components
- `PermissionGate`: Conditionally renders UI based on permissions
- `usePermissions` hook: Client-side permission checking
- Middleware: Server-side route protection
- Permission helpers: Centralized permission logic