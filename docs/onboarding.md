# Onboarding Flow Documentation

## Overview

The wedding planner onboarding flow is a multi-step process that guides new users through setting up their wedding planning account. The flow collects essential information to personalize the planning experience and create initial data structures.

## User States

The system tracks four distinct user states:

1. **ANON** - Unauthenticated user
2. **AUTH_NO_PROFILE** - Authenticated but hasn't started onboarding
3. **ONBOARDING_IN_PROGRESS** - Currently in the onboarding flow
4. **ONBOARDING_DONE** - Completed onboarding, full access granted

## Onboarding Steps

### 1. Welcome Page (`/onboarding/welcome`)
- **Purpose**: Introduction to the platform
- **Required**: Yes
- **Content**: Overview of features and benefits
- **Actions**: Single CTA to begin onboarding

### 2. Profile (`/onboarding/profile`)
- **Purpose**: Collect user information
- **Required**: Yes
- **Fields**:
  - Your name (required)
  - Partner's name (optional)
  - Role (required) - bride, groom, planner, family, other
  - Country (required)
  - Preferred currency

### 3. Event Details (`/onboarding/event`)
- **Purpose**: Basic wedding information
- **Required**: Yes
- **Fields**:
  - Wedding date or estimated timeframe
  - Wedding location (city)
  - Estimated guest count

### 4. Invite Team (`/onboarding/invite`)
- **Purpose**: Add collaborators
- **Required**: No (skippable)
- **Fields**:
  - Partner's email
  - Wedding planner or family member email
  - WhatsApp group link

### 5. Budget (`/onboarding/budget`)
- **Purpose**: Set financial parameters
- **Required**: Yes
- **Options**:
  - Exact budget amount
  - Budget tier selection
- **Features**: Localized tiers for Nigeria/Lagos

### 6. Vendor Priorities (`/onboarding/vendors`)
- **Purpose**: Identify top vendor needs
- **Required**: Yes
- **Constraint**: Select up to 3 categories
- **Categories**: Venue, Photography, Catering, Music/DJ, Flowers, Planner, Decor, Transport

### 7. Guest List (`/onboarding/guests`)
- **Purpose**: Start guest management
- **Required**: No (skippable)
- **Options**:
  - Manual entry (3 sample guests)
  - CSV import

### 8. Review (`/onboarding/review`)
- **Purpose**: Confirm all information
- **Required**: Yes
- **Features**: Edit capability for each section
- **Action**: "Generate My Plan" button

### 9. Success (`/onboarding/success`)
- **Purpose**: Celebrate completion
- **Content**: Overview of unlocked features
- **Action**: Navigate to dashboard

## Technical Implementation

### Database Schema

```prisma
model OnboardingProgress {
  id              String    @id @default(dbgenerated("gen_random_uuid()"))
  userId          String    @unique @map("user_id")
  stepCurrent     String?   @map("step_current")
  stepsCompleted  Json      @default("[]") @map("steps_completed")
  stepData        Json      @default("{}") @map("step_data")
  done            Boolean   @default(false)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  user            User      @relation(fields: [userId], references: [id])
}
```

### Middleware Protection

The middleware enforces onboarding completion:

```typescript
// Unauthenticated → /sign-in
// Authenticated but not onboarded → /onboarding/[lastStep]
// Onboarded users blocked from /onboarding/* → /dashboard
```

### API Endpoints

- `GET/POST /api/onboarding/[step]` - Get/save step data
- `POST /api/onboarding/complete` - Finalize onboarding

### Features

#### Autosave
- Debounced saving (1 second delay)
- Visual feedback (saving/saved indicators)
- Automatic data persistence

#### Progress Tracking
- Step counter in header
- Back navigation support
- Save & Exit functionality
- Resume from last incomplete step

#### Validation
- Client-side validation with error messages
- Accessibility support (aria-invalid, aria-describedby)
- Required field indicators

#### Telemetry Events
- `ob_started` - User begins onboarding
- `ob_step_viewed` - Step page loaded
- `ob_step_completed` - Step data saved
- `ob_skipped` - Optional step skipped
- `ob_completed` - Full flow completed

## Post-Onboarding

Upon completion, the system:

1. Creates/updates the couple record
2. Sets `hasOnboarded` flag on user
3. Sets `onboardingCompleted` cookie
4. Redirects to dashboard
5. Initializes default data structures

## Error Handling

- Network failures: Autosave retry logic
- Validation errors: Inline field errors
- Navigation guards: Prevent skipping required steps
- Session expiry: Redirect to sign-in with next parameter

## Localization

- Currency detection based on country
- Budget tiers adjusted for Nigeria
- Future support for multiple languages via `scribe` persona

## Testing

Playwright tests cover:
- Navigation flow
- Field validation
- Skip functionality
- Data persistence
- Back navigation
- Save & exit
- Complete flow