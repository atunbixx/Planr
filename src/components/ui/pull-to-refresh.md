# Pull-to-Refresh Component

A reusable pull-to-refresh component that provides a smooth, native-feeling refresh interaction for mobile devices and desktop.

## Features

- 💐 Wedding-themed visual indicators
- 📱 Touch and mouse support
- 🎯 Haptic feedback integration
- ⚡ Smooth 60fps animations
- 🎨 Customizable appearance
- 📊 Progress tracking
- ⏱️ Last refresh time display
- 🚀 Performance optimized

## Usage

```tsx
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

function MyPage() {
  const handleRefresh = async () => {
    // Your refresh logic here
    await fetchNewData();
  };

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullText="Pull to refresh"
      releaseText="Release to refresh"
      loadingText="Loading..."
      successText="Updated!"
    >
      {/* Your scrollable content */}
    </PullToRefresh>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onRefresh` | `() => Promise<void>` | Required | Async function called when refresh is triggered |
| `threshold` | `number` | `80` | Minimum pull distance (px) to trigger refresh |
| `maxPull` | `number` | `150` | Maximum pull distance (px) |
| `disabled` | `boolean` | `false` | Disable pull-to-refresh |
| `className` | `string` | - | Additional CSS classes |
| `refreshIndicator` | `ReactNode` | 💐 | Custom refresh indicator |
| `loadingIndicator` | `ReactNode` | Spinner | Custom loading indicator |
| `successIndicator` | `ReactNode` | ✨ | Custom success indicator |
| `pullText` | `string` | "Pull to refresh" | Text shown while pulling |
| `releaseText` | `string` | "Release to refresh" | Text shown when ready |
| `loadingText` | `string` | "Refreshing..." | Text shown while loading |
| `successText` | `string` | "Updated!" | Text shown on success |
| `showLastRefreshTime` | `boolean` | `true` | Show time since last refresh |

## Implementation Details

### Visual States

1. **Idle**: No visual indicator
2. **Pulling**: Shows pull indicator with pull text
3. **Ready**: Shows release indicator with release text
4. **Refreshing**: Shows loading spinner with loading text
5. **Success**: Shows success indicator briefly

### Performance Optimizations

- Debounced refresh calls prevent multiple simultaneous refreshes
- Hardware-accelerated CSS transforms for smooth animations
- Touch event passive listeners for better scrolling performance
- Minimal re-renders using optimized state management

### Integration with Data Hooks

All major pages integrate with their respective data hooks:

```tsx
// Dashboard
const { refreshSession } = useAuth();

// Vendors
const { refreshVendors } = useVendors();

// Budget
const { refreshBudget } = useBudget();

// Guests
const { refreshGuests } = useGuests();

// Messages - custom refresh logic
const handleRefreshMessages = async () => {
  // Fetch new messages
  await fetchNewMessages();
};
```

### Offline Support

The component works seamlessly with offline data caching:

```tsx
const handleRefresh = async () => {
  try {
    // Try to fetch fresh data
    await fetchFromServer();
  } catch (error) {
    // Fall back to cached data
    await loadFromCache();
  }
};
```

## Customization

### Custom Indicators

```tsx
<PullToRefresh
  refreshIndicator={<HeartIcon className="animate-pulse" />}
  loadingIndicator={<RingIcon className="animate-spin" />}
  successIndicator={<CheckIcon className="text-green-500" />}
/>
```

### Styling

```tsx
<PullToRefresh
  className="bg-white dark:bg-gray-900"
  // Custom styles are applied to the container
/>
```

## Best Practices

1. **Keep refresh operations fast** - Users expect quick feedback
2. **Show meaningful loading text** - Tell users what's happening
3. **Handle errors gracefully** - Don't leave users stuck in loading state
4. **Update last refresh time** - Helps users know data freshness
5. **Test on real devices** - Ensure smooth performance on actual phones

## Browser Support

- iOS Safari 10+
- Chrome 61+
- Firefox 52+
- Edge 16+
- Safari 10.1+

The component uses touch events for mobile and mouse events for desktop testing.