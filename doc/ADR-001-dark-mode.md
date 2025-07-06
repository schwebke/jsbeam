# ADR-001: Dark Mode Implementation

## Status
Proposed

## Context
JSBeam currently only supports a light theme. Modern web applications increasingly offer dark mode options to:
- Reduce eye strain in low-light environments
- Improve accessibility for users with light sensitivity
- Align with system preferences (macOS, Windows, mobile)
- Provide a professional appearance option

Given JSBeam's no-build architecture using vanilla CSS and Preact, we need a solution that fits this constraint.

## Decision
Implement dark mode using:

1. **CSS Custom Properties** for theming
2. **System preference detection** via `prefers-color-scheme`
3. **LocalStorage persistence** for user preference
4. **Theme toggle** in the application menu
5. **Document-level theme class** for global application

## Implementation Strategy

### Theme Management
- Add theme state to root `App` component
- Use `useState` and `useEffect` for theme management
- Persist preference in `localStorage`
- Initialize from system preference if no stored preference

### CSS Architecture
- Convert existing colors to CSS custom properties
- Define light/dark color schemes as CSS variables
- Use `.dark-theme` class on document root to switch themes
- Maintain existing visual hierarchy and contrast ratios

### UI Controls
- Add "Toggle Dark Mode" option to "?" menu
- Consider adding keyboard shortcut (Ctrl/Cmd + Shift + D)
- Provide visual feedback for current theme state

### Grid Considerations
- Light mode: black grid points on white background
- Dark mode: white grid points on dark background
- Ensure adequate contrast in both modes

## Technical Details

### Color Scheme
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f0f0f0;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #cccccc;
  --accent-color: #007acc;
  --grid-color: #000000;
}

.dark-theme {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --border-color: #444444;
  --accent-color: #4dabf7;
  --grid-color: #ffffff;
}
```

### State Management
```javascript
const [theme, setTheme] = useState('light');

useEffect(() => {
  const savedTheme = localStorage.getItem('jsbeam-theme');
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(savedTheme || systemPreference);
}, []);
```

## Alternatives Considered

1. **CSS-only solution with checkbox hack**
   - Rejected: Less maintainable, no JavaScript state management
   
2. **Separate CSS files for themes**
   - Rejected: Requires build process or dynamic CSS loading
   
3. **Inline styles with JavaScript**
   - Rejected: Poor maintainability, no CSS cascade benefits

## Consequences

### Positive
- Improved user experience and accessibility
- Modern, professional appearance
- Respects system preferences
- Maintains no-build architecture
- Easy to extend with additional themes

### Negative
- Slight increase in CSS complexity
- Additional JavaScript state management
- Need to test all UI components in both modes
- Potential for contrast issues requiring careful design

## Implementation Tasks
1. Define CSS custom properties for all colors
2. Add theme state management to App component
3. Implement theme toggle in menu
4. Add localStorage persistence
5. Test all components in both themes
6. Update grid colors for dark mode
7. Add system preference detection