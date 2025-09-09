# NPS Widget SDK Documentation

## Quick Start

Add this script to your website to automatically show all your published NPS surveys:

```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
    script.setAttribute('data-position', 'bottom-right');
    script.setAttribute('data-delay', '5000');
    script.setAttribute('data-auto-rotate', 'true');
    script.setAttribute('data-show-once', 'false');
    document.head.appendChild(script);
  })();
</script>
```

## Widget Types

### 1. Universal Widget (Recommended)
Shows ALL published surveys automatically. No need to update code when you publish new surveys.

```html
<script src="https://melodic-melba-d65cd6.netlify.app/nps-universal.js"
  data-position="bottom-right"
  data-delay="5000"
  data-auto-rotate="true"
  data-show-once="false">
</script>
```

### 2. Specific Survey Widget
Shows a specific survey by ID.

```html
<script src="https://melodic-melba-d65cd6.netlify.app/nps-widget.js"
  data-survey-id="your-survey-id"
  data-position="bottom-right"
  data-delay="3000">
</script>
```

### 3. Inline Embed
Embeds the survey directly in a specific container on your page.

```html
<div id="nps-survey-container"></div>
<script src="https://melodic-melba-d65cd6.netlify.app/nps-inline.js"
  data-survey-id="your-survey-id"
  data-container="nps-survey-container">
</script>
```

## Configuration Options

### Universal Widget Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-position` | `bottom-right` | Widget position: `bottom-right`, `bottom-left`, `top-right`, `top-left`, `center` |
| `data-delay` | `5000` | Delay before showing widget (milliseconds) |
| `data-auto-rotate` | `true` | Automatically rotate between multiple surveys |
| `data-show-once` | `false` | Show widget only once per user |

### Specific Widget Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-survey-id` | Required | The ID of the survey to display |
| `data-position` | `bottom-right` | Widget position |
| `data-delay` | `3000` | Delay before showing widget (milliseconds) |

## Examples

### Basic Implementation
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your website content -->
  
  <!-- NPS Widget - Add before closing body tag -->
  <script>
    (function() {
      var script = document.createElement('script');
      script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
      script.setAttribute('data-position', 'bottom-right');
      script.setAttribute('data-delay', '5000');
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>
```

### Advanced Configuration
```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
    
    // Position the widget in the top-right corner
    script.setAttribute('data-position', 'top-right');
    
    // Show after 10 seconds
    script.setAttribute('data-delay', '10000');
    
    // Don't rotate between surveys
    script.setAttribute('data-auto-rotate', 'false');
    
    // Show only once per user
    script.setAttribute('data-show-once', 'true');
    
    document.head.appendChild(script);
  })();
</script>
```

### React/Next.js Implementation
```jsx
import { useEffect } from 'react';

export default function MyComponent() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
    script.setAttribute('data-position', 'bottom-right');
    script.setAttribute('data-delay', '5000');
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

### WordPress Implementation
Add this to your theme's `functions.php` file:

```php
function add_nps_widget() {
    ?>
    <script>
      (function() {
        var script = document.createElement('script');
        script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
        script.setAttribute('data-position', 'bottom-right');
        script.setAttribute('data-delay', '5000');
        document.head.appendChild(script);
      })();
    </script>
    <?php
}
add_action('wp_footer', 'add_nps_widget');
```

## Testing Your Implementation

1. **Test Mode**: Set `data-delay="1000"` for faster testing
2. **Clear Storage**: Clear localStorage to reset "show once" settings
3. **Check Console**: Open browser console to see widget loading messages
4. **Multiple Surveys**: Publish multiple surveys to test auto-rotation

## Troubleshooting

### Widget Not Appearing
- Check that you have published surveys
- Verify the script URL is correct
- Check browser console for errors
- Ensure the delay has passed

### Widget Appearing Multiple Times
- Make sure you only have one widget script per page
- Check for duplicate script tags

### Styling Issues
- The widget uses inline styles and shouldn't conflict with your CSS
- If needed, you can override styles using `!important`

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers supported

## Performance
- Script size: ~15KB minified
- No external dependencies
- Lazy loads survey content
- Minimal impact on page load speed

## Security
- All scripts are served over HTTPS
- No sensitive data is stored in localStorage
- CORS headers properly configured
- XSS protection built-in