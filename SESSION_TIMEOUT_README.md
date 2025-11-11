# Session Timeout Implementation

This document explains the session timeout functionality implemented in the INSPOCRM application.

## Overview

The session timeout system automatically logs out users after 30 minutes of inactivity for security purposes. It includes:

- **Automatic timeout detection** based on user activity
- **Warning modal** 5 minutes before timeout
- **Activity tracking** for mouse, keyboard, touch, and scroll events
- **Cross-tab synchronization** to handle multiple browser tabs
- **Graceful logout** with user notification

## Files Created

### 1. `src/hooks/use-session-timeout.tsx`
Main hook that handles session timeout logic.

**Features:**
- Tracks user activity (mousedown, mousemove, keypress, scroll, touchstart, click)
- Shows warning 5 minutes before timeout
- Automatically logs out after 30 minutes of inactivity
- Resets timer on user activity
- Handles cross-tab synchronization

**Usage:**
```tsx
import { useSessionTimeout } from '@/hooks/use-session-timeout';

const MyComponent = () => {
  const { showWarning, remainingTime, extendSession } = useSessionTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes (optional, default)
    promptBefore: 5 * 60 * 1000, // Show warning 5 minutes before (optional, default)
  });

  return (
    // Your component JSX
  );
};
```

### 2. `src/components/ui/session-timeout-warning.tsx`
Modal component that displays the session timeout warning.

**Features:**
- Beautiful modal design with countdown timer
- "Stay Logged In" and "Logout Now" options
- Auto-logout when timer reaches zero
- Responsive design

**Usage:**
```tsx
import { SessionTimeoutWarning } from '@/components/ui/session-timeout-warning';

<SessionTimeoutWarning
  isVisible={showWarning}
  remainingTime={remainingTime}
  onExtend={extendSession}
  onLogout={() => handleLogout()}
/>
```

### 3. Integration in `src/App.tsx`
The session timeout is automatically integrated into the main App component.

**How it works:**
- Only active for authenticated users
- Monitors activity across the entire application
- Shows warning modal when timeout is approaching
- Handles logout automatically

## Configuration Options

### Timeout Duration
```tsx
const { showWarning, remainingTime, extendSession } = useSessionTimeout({
  timeout: 45 * 60 * 1000, // 45 minutes instead of default 30
});
```

### Warning Timing
```tsx
const { showWarning, remainingTime, extendSession } = useSessionTimeout({
  promptBefore: 10 * 60 * 1000, // Show warning 10 minutes before timeout
});
```

### Custom Handlers
```tsx
const { showWarning, remainingTime, extendSession } = useSessionTimeout({
  onWarning: (timeLeft) => {
    console.log(`Warning: ${timeLeft} seconds remaining`);
    // Custom warning logic
  },
  onTimeout: () => {
    console.log('Session timed out');
    // Custom timeout logic
  }
});
```

## Activity Events Tracked

The system tracks these user activities to reset the timeout timer:

- `mousedown` - Mouse button press
- `mousemove` - Mouse movement
- `keypress` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch screen interaction
- `click` - Click events

## Security Features

1. **Automatic Logout**: Users are automatically logged out after inactivity
2. **Warning System**: Users get a 5-minute warning before logout
3. **Activity Reset**: Timer resets on any user interaction
4. **Cross-tab Sync**: Logout in one tab logs out all tabs
5. **Secure Navigation**: Redirects to login page after timeout

## Customization

### Changing Timeout Duration
Modify the timeout values in the `SessionTimeoutManager` component in `App.tsx`:

```tsx
const { showWarning, remainingTime, extendSession } = useSessionTimeout({
  timeout: 60 * 60 * 1000, // 1 hour
  promptBefore: 10 * 60 * 1000, // 10 minute warning
});
```

### Custom Warning Modal
Create your own warning component by implementing the same interface:

```tsx
interface CustomWarningProps {
  isVisible: boolean;
  remainingTime: number;
  onExtend: () => void;
  onLogout: () => void;
}
```

### Styling
The warning modal uses Tailwind CSS classes and can be customized by modifying the component styles.

## Testing

To test the session timeout functionality:

1. **Login** to the application
2. **Wait** for 25 minutes (warning appears at 25 minutes)
3. **Verify** the warning modal appears with countdown
4. **Click "Stay Logged In"** to extend session
5. **Wait** for automatic logout at 30 minutes
6. **Verify** redirect to login page

## Browser Compatibility

- **Modern browsers**: Full support
- **Mobile browsers**: Touch events supported
- **Older browsers**: Graceful degradation (may not track all activity types)

## Troubleshooting

### Timer not resetting
- Check that activity events are being tracked
- Verify the component is mounted for authenticated users
- Check browser console for errors

### Warning not showing
- Ensure the user is authenticated
- Check that `showWarning` state is true
- Verify modal is rendered in the component tree

### Logout not working
- Check that the `logout` function from `useAuth` is working
- Verify navigation to login page
- Check for errors in browser console

## Future Enhancements

Potential improvements:
- Server-side session validation
- Configurable timeout per user role
- Activity logging for security audit
- Remember me functionality
- Idle time display in UI
- Custom timeout messages per organization
