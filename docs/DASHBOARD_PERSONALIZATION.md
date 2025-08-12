# Dashboard Personalization Documentation

## Overview

The wedding planner dashboard features comprehensive personalization that displays the bride's name and wedding countdown based on data entered during the onboarding process. This creates a warm, welcoming experience tailored to each user's wedding details.

## Features

### Welcome Message
- Displays personalized greeting using the bride's name from onboarding
- Format: "Welcome back, [FirstName]!" with appropriate emoji
- Fallback to "Bride" if name data is unavailable

### Wedding Countdown
- Shows exact days until the wedding date
- Format: "Your wedding is [X] days away!" with wedding emoji
- Automatically calculates from current date to wedding date
- Updates dynamically as the wedding approaches

### Wedding Details Display
- Partner names as entered during onboarding
- Wedding date with proper formatting
- Venue information
- Complete wedding statistics (guests, vendors, budget)

## Technical Implementation

### Database Schema
The personalization relies on the `couples` table structure:

```sql
couples:
- partner1_name: Bride's full name (primary source for personalization)
- partner2_name: Groom's full name
- wedding_date: Date for countdown calculation
- venue_name: Wedding venue display
- user_id: Links to authenticated user
```

### API Integration

#### Dashboard Stats Endpoint
**Endpoint**: `/api/dashboard/stats`

**Response Structure**:
```typescript
interface DashboardStats {
  userInfo: {
    firstName: string     // Extracted from partner1_name
    lastName: string      // Extracted from partner1_name
    partnerName: string   // From partner2_name
  }
  daysUntilWedding: number | null
  weddingDate: string | null
  venue: string | null
  // ... other stats
}
```

**Name Extraction Logic**:
```typescript
const userInfo = {
  firstName: couple.partner1_name?.split(' ')[0] || 'Bride',
  lastName: couple.partner1_name?.split(' ').slice(1).join(' ') || '',
  partnerName: couple.partner2_name || ''
}
```

### Frontend Implementation

#### React Component Structure
The dashboard personalizes content in two theme layouts:

**Bridal Theme**:
```tsx
<h1 className="text-2xl font-semibent text-muted-foreground">
  Welcome back, {stats?.userInfo?.firstName || 'Bride'}! 👋
</h1>
{stats.daysUntilWedding && stats.daysUntilWedding > 0 && (
  <p className="text-lg text-foreground mt-1">
    Your wedding is <span className="font-bold text-rose-600">
      {stats.daysUntilWedding} days away
    </span> 💒
  </p>
)}
```

**Standard Theme**:
```tsx
<h1 className="text-2xl font-semibold text-muted-foreground mb-1">
  Welcome back, {stats?.userInfo?.firstName || 'Bride'}! 👋
</h1>
<h2 className="text-4xl font-bold text-foreground mb-2">
  {stats.daysUntilWedding && stats.daysUntilWedding > 0 
    ? `Your wedding is ${stats.daysUntilWedding} days away! 💒`
    : t('dashboard.yourWeddingDay')
  }
</h2>
```

## Data Sources Priority

### Name Display Hierarchy
1. **Primary**: `couple.partner1_name` from onboarding form
2. **Fallback**: "Bride" as default display

### Key Design Decision
**Uses onboarding data exclusively** - The system deliberately uses names entered during the wedding planning onboarding process rather than Clerk authentication names. This ensures the dashboard displays the bride and groom's actual names as they want them to appear for their wedding.

## User Experience

### Onboarding Flow
1. User completes authentication with Clerk
2. During onboarding, user enters:
   - Bride's full name (partner1_name)
   - Groom's full name (partner2_name)  
   - Wedding date
   - Venue details
3. Dashboard immediately personalizes using this data

### Dashboard Display Examples

**Sample Welcome Messages**:
- "Welcome back, Atunbi!" 
- "Welcome back, Sarah!"
- "Welcome back, Maria!"

**Sample Wedding Countdowns**:
- "Your wedding is 15 days away! 💒"
- "Your wedding is 127 days away! 💒"
- "Your wedding day is here! 🎉"

## Authentication & Security

### User Context
- Requires valid Clerk authentication session
- Links personalization data through `user_id` relationship
- Onboarding completion verification via middleware

### Data Protection
- Names stored securely in encrypted database
- Personal information never exposed in client logs
- Follows data protection best practices

## Styling & Themes

### Responsive Design
- Adapts to mobile, tablet, and desktop screen sizes
- Consistent personalization across all breakpoints
- Theme-appropriate styling (bridal vs standard)

### Typography & Colors
- **Bridal Theme**: Rose/pink accent colors, elegant typography
- **Standard Theme**: Gradient backgrounds, bold wedding countdown
- Emoji usage for warmth and celebration

## Troubleshooting

### Common Issues

**"Bride" showing instead of actual name**:
- Verify onboarding completion in database
- Check `couple.partner1_name` field population
- Confirm user authentication and session state

**Wedding countdown showing negative days**:
- Update `couple.wedding_date` to future date
- Verify date format and timezone handling

**Personalization not loading**:
- Check API endpoint `/api/dashboard/stats` response
- Verify database connection and user relationships
- Clear cache if using caching layer

### Debug Scripts
Located in `/scripts/` directory:
- `test-onboarding-name.ts` - Verify name extraction logic
- `verify-dashboard-personalization.ts` - Complete personalization test
- `check-seeded-data.ts` - Database relationship verification

## Performance Considerations

### Caching Strategy
- Dashboard stats cached with TTL for performance
- Cache invalidation on user data updates
- Efficient database queries with selective field loading

### Database Optimization
- Indexed queries on `user_id` and `clerk_user_id`
- Minimal data selection for API responses
- Relationship queries optimized for performance

## Future Enhancements

### Planned Features
- Additional personalization based on wedding preferences
- Dynamic content based on wedding timeline
- Customizable dashboard greeting messages
- Multi-language personalization support

### Extensibility
- Modular component structure for easy enhancement
- API structure supports additional user information
- Theme system allows for new personalization styles

## Testing

### Test Coverage
- Unit tests for name extraction logic
- Integration tests for API endpoints  
- E2E tests for complete user flow
- Database relationship validation tests

### Manual Testing Checklist
- [ ] Onboarding name entry flows correctly
- [ ] Dashboard displays correct personalized name
- [ ] Wedding countdown calculates accurately
- [ ] Fallback behavior works when data missing
- [ ] Both themes display personalization correctly
- [ ] Mobile responsiveness maintained

---

## Summary

The dashboard personalization system successfully creates a warm, personalized experience by:

✅ **Using onboarding names** rather than login credentials  
✅ **Displaying accurate wedding countdowns** with proper date calculations  
✅ **Providing consistent personalization** across multiple theme layouts  
✅ **Implementing robust fallback behavior** for missing data  
✅ **Maintaining security and performance** standards  

This feature enhances user engagement by making the wedding planning experience feel personal and celebratory from the moment users access their dashboard.